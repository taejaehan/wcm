wcm.controller('WarningMapController', function($scope, $stateParams, $cordovaGeolocation, $ionicLoading, $ionicActionSheet) {
    
    $scope.cards = null;
    $scope.map = null;
    $scope.markerClusterer = null;
    $scope.markers = [];
    $scope.infoWindow = null;
    $scope.usegmm = { checked: true };
    $scope.warningTitle = 'Ongoing';

    $scope.$on('$ionicView.loaded', function(){
      $scope.init();
    });
    
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
      $scope.infoWindow = new google.maps.InfoWindow();

      $scope.showMarkers(1);

      // find me 넣기
      var findMe = document.getElementById('find-me-warn');
      $scope.map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(findMe);

      /****************************** Serch box start ******************************/
      var input = document.getElementById('pac-input-warn');
      var searchBox = new google.maps.places.SearchBox(input);
      $scope.map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

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

    //내 위치 찾기
    $scope.centerOnMe = function() {
        $ionicLoading.show({
            template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Acquiring location!'
        });
         
        var posOptions = {
            enableHighAccuracy: true,
            timeout: 20000,
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
            alert('You can not use the location information');
            console.log('CURRENT LOCATION ERROR :  ' + err);
        });
    }

    /*
    * marker를 보여줍니다
    * @param - index 0 - discoverd , 1 - ongoing,  2-completed
    */
    $scope.showMarkers = function(index) {

      var markerUrl, clusterUrl, clusterBigUrl, clusterTextColor;
      $scope.markers = [];

      if ($scope.markerClusterer) {
        $scope.markerClusterer.clearMarkers();
      }

      //marker 숫자 제한하는 것 주석처리 함
      // var numMarkers = document.getElementById('nummarkers').value;
      // if(numMarkers > $scope.cards.length) numMarkers = $scope.cards.length;

      for (var i = 0; i < $scope.cards.length; i++) {
        switch(index){
          case 0 :
            if($scope.cards[i].status != '0' && $scope.cards[i].status != '33') continue;
            markerUrl = '../img/location_r.png';
            clusterUrl = '../img/cluster_r.png';
            clusterBigUrl = '../img/cluster_r_big.png';
            clusterTextColor = '#9c3625';
            $scope.warningTitle = 'Discovered';
            break;
          case 1 :
            if($scope.cards[i].status != '66') continue;
            markerUrl = '../img/location_y.png';
            clusterUrl = '../img/cluster_y.png';
            clusterBigUrl = '../img/cluster_y_big.png';
            clusterTextColor = '#e38b0d';
            $scope.warningTitle = 'Ongoing';
            break;
          case 2 :
            if($scope.cards[i].status != '100') continue;
            markerUrl = '../img/location_g.png';
            clusterUrl = '../img/cluster_g.png';
            clusterBigUrl = '../img/cluster_g_big.png';
            clusterTextColor = '#264804';
            $scope.warningTitle = 'Completed';
            break;
          default : 
            markerUrl = '../img/location_y.png';
            clusterUrl = '../img/cluster_y.png';
            clusterBigUrl = '../img/cluster_y_big.png';
            clusterTextColor = '#e38b0d';
            $scope.warningTitle = 'Ongoing';
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
      mcOptions = {maxZoom: 20, 
        styles: [{
      height: 56,
      url: clusterUrl,
      width: 56,
      textColor : clusterTextColor,
      textSize : 16
      },
      {
      height: 80,
      url: clusterBigUrl,
      width: 80,
      textColor : clusterTextColor,
      textSize : 20
      }]}
      $scope.markerClusterer = new MarkerClusterer($scope.map, $scope.markers,mcOptions);
      if(document.getElementById('location-button-img') != null){
        document.getElementById('location-button-img').setAttribute('src', markerUrl);
      }
    };

    $scope.markerClickFunction = function(pic, latlng) {
      return function(e) {
        e.cancelBubble = true;
        e.returnValue = false;
        if (e.stopPropagation) {
          e.stopPropagation();
          e.preventDefault();
        }
        var title = pic.title;
        var url = "#/tab/home/"+pic.id;
        var fileurl = pic.img_path;
        if(fileurl == ''){
          fileurl = mNoImage;
        }else{
          fileurl = mServerUrl + fileurl;
        }

        var username = '';

        var infoHtml = '<div class="info"><h3>' + title +
          '</h3><div class="info-body">' +
          '<a href="' + url + '"><img src="' +
          fileurl + '" class="info-img"/></a></div>' +
          '<a href="' + pic.user[0].userimage + '" target="_blank">' + pic.user[0].username +
          '</a></div></div>';

        $scope.infoWindow.setContent(infoHtml);
        $scope.infoWindow.setPosition(latlng);
        $scope.infoWindow.open($scope.map);
      };
    };

    $scope.clear = function() {
      for (var i = 0, marker; marker = $scope.markers[i]; i++) {
        marker.setMap(null);
      }
    };

    $scope.changeMarkers = function() {
      // Show the marker sheet
     var hideSheet = $ionicActionSheet.show({
       buttons: [
         { text: 'Discovered' },
         { text: 'Ongoing' },
         { text: 'Completed' }
       ],
       cssClass : 'warning_sheet',
       // destructiveText: 'Delete',
       titleText: 'Selcet Wanring',
       cancelText: 'Cancel',
       cancel: function() {
          // add cancel code..
        },
       buttonClicked: function(index) {
          console.log('index :  ' + index);
          $scope.clear();
          $scope.showMarkers(index);
          return true;
       },
     });
    }
});
