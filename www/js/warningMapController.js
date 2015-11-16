wcm.controller('WarningMapController', function($scope, $stateParams, $cordovaGeolocation, $ionicLoading, $ionicActionSheet, $ionicPopup, $ionicPopover, $window, $ionicModal, $timeout) {
    
    $scope.cards = null;
    $scope.map = null;
    $scope.markerClusterer = null;
    $scope.markers = [];
    $scope.infoWindow = null;
    $scope.usegmm = { checked: true };
    $scope.warningTitle = ONGOING_TEXT;


    //마커를 클릭했을 때 나오는 정보
    $scope.markerTitle = '';
    $scope.markerLocation = '';
    $scope.markerImg = '';

    //마커를 클릭했을 때 나오는 상세 정보 view modal
    $ionicModal.fromTemplateUrl('templates/modal.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modal = modal;
    });

    $scope.$on('$ionicView.loaded', function(){
      $scope.init();
    });
      
    $scope.$on('$ionicView.beforeLeave', function(){
      console.log('beforeLeave');
      if($scope.popover != null && $scope.popover._isShown){
        $scope.popover.hide();
      }
    });
      
    //sort type
    $scope.markerTypeList = [
      { 
        text: COMPLETED_TEXT, 
        radio_calss:"popover_select_g", 
        value: COMPLETED
      },
      { 
        text: ONGOING_TEXT, 
        radio_calss:"popover_select_y", 
        value: ONGOING 
      },
      { text: DISCOVERED_TEXT, 
        radio_calss:"popover_select_r", 
        value: DISCOVERED 
      }
    ];

    //sort type default value
    $scope.data = {
      markerType: DISCOVERED
    };

    /*
    * WarningMap을 초기화합니다
    */
    $scope.init = function() {
      console.log('init!!!');
      var latlng = new google.maps.LatLng(37.574515, 126.976930);
      var options = {
        'zoom': 11,
        'minZoom' : 3,
        'center': latlng,
        'mapTypeId': google.maps.MapTypeId.ROADMAP,
        'mapTypeControl' : false,     //지도, 위성
        'streetViewControl' : false,   //거리뷰
        'panControl' : false,           //위치 조절 pan
        'zoomControl' : false,         //확대/축소 pan
      };

      $scope.map = new google.maps.Map(document.getElementById("map-warn"), options);

      var cardList = JSON.parse(window.localStorage['cardList'] || '{}');
      // $scope.cards = data.photos;
      $scope.cards = cardList.cards;

      //marker 숫자 제한하는 select 부분 listener등록 주석처리함
      // var numMarkers = document.getElementById('nummarkers');
      // google.maps.event.addDomListener(numMarkers, 'change', $scope.change);

      //infoWindow
      $scope.infoWindow = new google.maps.InfoWindow({
        maxWidth : 300
      });

      /*google map infoWindow에 custom style처리가 없어서 dom으로 찾아 처리*/
      google.maps.event.addListener($scope.infoWindow, 'domready', function() {

        var iwOuter = document.getElementsByClassName('gm-style-iw');
        iwOuter[0].children[0].style.backgroundColor = '#fff';
        /* The DIV we want to change is above the .gm-style-iw DIV.
        * So, we use jQuery and create a iwBackground variable,
        * and took advantage of the existing reference to .gm-style-iw for the previous DIV with .prev().
        */
        var iwBackground = iwOuter[0].previousSibling;
        while(iwBackground && iwBackground.nodeType != 1) {
          iwBackground = iwBackground.previousSibling;
        };
        // Remove the background shadow DIV
        iwBackground.children[1].style.display ='none';
        // Remove the white background DIV
        iwBackground.children[3].style.display ='none';
        //tail remove
        iwBackground.children[0].style.display ='none';
        iwBackground.children[2].style.display ='none';
        var iwCloseBtn = iwOuter[0].nextSibling;
        while(iwCloseBtn && iwCloseBtn.nodeType != 1) {
          iwCloseBtn = iwCloseBtn.nextSibling;
        };
        
        /*CLOSE 버튼 시작*/
        // Apply the desired effect to the close button
        iwCloseBtn.style.width =  '20px'; // by default the close button has an opacity of 0.7;
        iwCloseBtn.style.height =  '20px'; // by default the close button has an opacity of 0.7;
        iwCloseBtn.style.opacity =  '1'; // by default the close button has an opacity of 0.7;
        iwCloseBtn.style.right = '40px';  // button repositioning
        iwCloseBtn.style.top = '30px';  // button repositioning
         // close button img
        iwCloseBtn.children[0].src = 'img/close.png';
        iwCloseBtn.children[0].style.position = 'initial';
        iwCloseBtn.children[0].style.width = '100%';
        iwCloseBtn.children[0].style.height = '100%';
        //실제로 버튼이 눌리는 곳
        var iwCloseBtnTransparent = iwCloseBtn.nextSibling;
        if(iwCloseBtnTransparent != null){
          while(iwCloseBtnTransparent && iwCloseBtnTransparent.nodeType != 1) {
            iwCloseBtnTransparent = iwCloseBtnTransparent.nextSibling;
          };
          iwCloseBtnTransparent.style.right = '30px';  // button repositioning
          iwCloseBtnTransparent.style.top = '20px';  // button repositioning
        }
        
        /*CLOSE 버튼 끝*/
      });

      $scope.showMarkers(DISCOVERED);

      // find me 넣기
      var findMe = document.getElementById('find-me-warn');
      $scope.map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(findMe);

      // change marker 넣기
      var changeMarkers = document.getElementById('change-marker-type');
      $scope.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(changeMarkers);
      
      /****************************** Serch box start ******************************/
      var input = document.getElementById('pac-input-warn');
      var searchBox = new google.maps.places.SearchBox(input);
      var inputBox = document.getElementById('input-box-div');
      $scope.map.controls[google.maps.ControlPosition.TOP_LEFT].push(inputBox);

      // Bias the SearchBox results towards current map's viewport.
      $scope.map.addListener('bounds_changed', function() {
        searchBox.setBounds($scope.map.getBounds());
      });
      // Listen for the event fired when the user selects a prediction and retrieve
      // more details for that place.
      searchBox.addListener('places_changed', function() {
        var places = searchBox.getPlaces();
        if (places.length == 0) {
          return;
        }
        // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds();
        places.forEach(function(place) {
          if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
          } else {
            bounds.extend(place.geometry.location);
          }
        });
        $scope.map.fitBounds(bounds);
      });
      /****************************** Serch box end ******************************/
    };

    /*
    * 내 위치 찾기 (지도를 현재 내 위치로 이동)
    */
    $scope.centerOnMe = function() {
        $ionicLoading.show({
            template: '<ion-spinner icon="bubbles"></ion-spinner><br/>위치를 찾고 있습니다',
            duration : 5000
        });
        
        var posOptions = {
            enableHighAccuracy: true,
            timeout: 4000,
            maximumAge: 0
        };
        $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
            var lat  = position.coords.latitude;
            var long = position.coords.longitude;
             
            var myLatlng = new google.maps.LatLng(lat, long);
             
            var mapOptions = {
                center: myLatlng,
                zoom: 16,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            }; 
            $scope.map.setOptions(mapOptions);    
            $ionicLoading.hide();           
             
        }, function(err) {
            $ionicLoading.hide();
            $ionicPopup.alert({
              title: mAppName,
              template: '위치 정보를 사용할 수 없습니다',
              cssClass: 'wcm-error'
             });
            console.log('CURRENT LOCATION ERROR :  ' + err);
        });

        $timeout(function() {
          $ionicLoading.hide();
        }, 1000);
    }

    /*
    * marker 및 cluster를 보여줍니다
    * @param - type DISCOVERED, ONGOING, COMPLETED
    */
    $scope.showMarkers = function(type) {

      switch(type){
        case DISCOVERED :
          $scope.warningTitle = DISCOVERED_TEXT;
          break;
        case ONGOING :
          $scope.warningTitle = ONGOING_TEXT;
          break;
        case COMPLETED :
          $scope.warningTitle = COMPLETED_TEXT;
          break;
        default : 
          $scope.warningTitle = ONGOING_TEXT;
      };
      
      if($scope.popover != null && $scope.popover._isShown){
        $scope.popover.hide();
      }

      var markerUrl, clusterUrl, clusterBigUrl, clusterTextColor;
      $scope.markers = [];

      if ($scope.markerClusterer) {
        $scope.markerClusterer.clearMarkers();
      }

      //marker 숫자 제한하는 것 주석처리 함
      // var numMarkers = document.getElementById('nummarkers').value;
      // if(numMarkers > $scope.cards.length) numMarkers = $scope.cards.length;

      for (var i = 0; i < $scope.cards.length; i++) {

        //card type에 따라 이미지/색을 변경 한다 index 0 - discoverd , 1 - ongoing,  2-completed
        switch(type){
          case DISCOVERED :
            if($scope.cards[i].status != PROGRESS_REGISTER && $scope.cards[i].status != PROGRESS_START) continue;
            markerUrl = 'img/location_r.png';
            clusterUrl = 'img/cluster_r.png';
            clusterBigUrl = 'img/cluster_r_big.png';
            clusterTextColor = '#9c3625';
            break;
          case ONGOING :
            if($scope.cards[i].status != PROGRESS_ONGOING) continue;
            markerUrl = 'img/location_y.png';
            clusterUrl = 'img/cluster_y.png';
            clusterBigUrl = 'img/cluster_y_big.png';
            clusterTextColor = '#e38b0d';
            break;
          case COMPLETED :
            if($scope.cards[i].status != PROGRESS_COMPLETED) continue;
            markerUrl = 'img/location_g.png';
            clusterUrl = 'img/cluster_g.png';
            clusterBigUrl = 'img/cluster_g_big.png';
            clusterTextColor = '#264804';
            break;
          default : 
            markerUrl = 'img/location_y.png';
            clusterUrl = 'img/cluster_y.png';
            clusterBigUrl = 'img/cluster_y_big.png';
            clusterTextColor = '#e38b0d';
        }

        var titleText = $scope.cards[i].title;
        if (titleText === '') {
          titleText = 'No title';
        }

        var item = document.createElement('DIV');
        var title = document.createElement('A');
        title.href = '#';
        title.className = 'title';
        title.innerHTML = titleText;

        item.appendChild(title);

        var latLng = new google.maps.LatLng($scope.cards[i].location_lat,
            $scope.cards[i].location_long);

        var markerImage = new google.maps.MarkerImage(markerUrl,
            new google.maps.Size(50, 50),
            new google.maps.Point(0, 0),
            new google.maps.Point(15, 25),
            new google.maps.Size(30, 30));


        var marker = new google.maps.Marker({
          'position': latLng,
          'icon': markerImage
        });

        var fn = $scope.markerClickFunction($scope.cards[i], latLng);
        google.maps.event.addListener(marker, 'click', fn);
        google.maps.event.addDomListener(title, 'click', fn);

        $scope.markers.push(marker);
      }

      // window.setTimeout($scope.time, 0);

      //현재는 2단계 까지만 설정해 놓음 후에 추가 예정 (5단계 까지 가능)
      mcOptions = {maxZoom: 20, 
        styles: [{
      height: 56,
      url: clusterUrl,
      width: 56,
      // textColor : clusterTextColor,
      textColor : '#eee',
      textSize : 16,
      fontWeight : "lighter"  //동작안됨;
      },
      {
      height: 80,
      url: clusterBigUrl,
      width: 80,
      // textColor : clusterTextColor,
      textColor : '#fff',
      textSize : 20,
      fontWeight : "normal" //동작안됨;
      }]}
      $scope.markerClusterer = new MarkerClusterer($scope.map, $scope.markers,mcOptions);
      if(document.getElementById('location-button-img') != null){
        document.getElementById('location-button-img').setAttribute('src', markerUrl);
      }
    };

    /*
    * 개별 marker를 클릭했을 경우 infoHtml 창을 띄운다
    */
    $scope.markerClickFunction = function(pic, latlng) {
      return function(e) {
        e.cancelBubble = true;
        e.returnValue = false;
        if (e.stopPropagation) {
          e.stopPropagation();
          e.preventDefault();
        }
        var title = pic.title;
        var status = pic.status;
        var location = pic.location_name;
        var location_img;
        switch(status){
          case PROGRESS_REGISTER :
          case PROGRESS_START : 
            location_img = "img/location_r.png"
            break;
          case PROGRESS_ONGOING :
            location_img = "img/location_y.png"
            break;
          case PROGRESS_COMPLETED :
            location_img = "img/location_g.png"
            break;
          default :
            location_img = "img/location_y.png"
            break;
        }
        var url = "#/tab/home/"+pic.id;
        var fileurl = pic.img_path;
        if(fileurl == '' || fileurl == mNoImage){
          fileurl = mNoImage;
        }else{
          fileurl = mServerUploadThumb + fileurl;
        }

        //img가 load되는 지 검사 후 정보를 보여준다
        var imageLoader=new Image();
        imageLoader.onload=imageFound;
        imageLoader.onerror=imageNotFound;
        imageLoader.src=fileurl;
        function imageNotFound() {
            console.log('That image was not found.');
            fileurl =mNoImageThumb;
            showInfo();
        };
        function imageFound() {
          showInfo();
        };

        function showInfo(){
          var username = '';
          var infoHtml = 
            '<div class="info">'+
               '<div class="info-top">'+
                '<h3>' + title + '</h3>'+
                '<img class="info_location_img" src='+location_img+' />' + 
                '<span class="info_location_text">' + location +'</span>' +
              '</div>' +
              '<a href="' + url + '">'+
                '<div class="info-body">'+
                    '<img src="' + fileurl + '" class="info-img" />'+
                    '<div class="detail_view">' + '자세히 보기 &gt;' + '</div>'
                '</div>' +
              '</a>'+
              // '<a href="http://facebook.com/' + pic.user[0].user_id + '" target="_blank">' + pic.user[0].username +
              // '</a>'+
            '</div>';
          $scope.infoWindow.setContent(infoHtml);
          $scope.infoWindow.setPosition(latlng);
          $scope.infoWindow.open($scope.map);
        }
      };
    };

    /*
    * marker clear
    */
    $scope.clear = function() {
      for (var i = 0, marker; marker = $scope.markers[i]; i++) {
        marker.setMap(null);
      }
    };

  /*
  * plus 버튼을 눌렀을 때 popover show
  * $event 클릭된 event
  */
  $scope.showSelectPopover = function ($event) {
    console.log('showSelectPopover!');
   $ionicPopover.fromTemplateUrl('templates/markerSelectPopover.html', {
     scope: $scope
   }).then(function(popover) {
     $scope.popover = popover;
     $scope.popover.show($event);
   });
  };
});
