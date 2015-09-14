wcm.controller('WarningMapController', function($scope, $stateParams, $cordovaGeolocation, $ionicLoading) {
    
    $scope.cards = null;
    $scope.map = null;
    $scope.markerClusterer = null;
    $scope.markers = [];
    $scope.infoWindow = null;
    $scope.usegmm = { checked: true };

    $scope.$on('$ionicView.afterEnter', function(){
      $scope.init();
    });

    $scope.init = function() {

      var latlng = new google.maps.LatLng(37.574515, 126.976930);
      var options = {
        'zoom': 11, //init
        'minZoom' : 3,
        'center': latlng,
        'mapTypeId': google.maps.MapTypeId.ROADMAP,
        'mapTypeControl' : false,     //지도, 위성
        'streetViewControl' : false,   //거리뷰
        'panControl' : false,           //위치 조절 pan
        'zoomControl' : false,         //확대/축소 pan
      };

      var cardList = JSON.parse(window.localStorage['cardList'] || '{}');

      $scope.map = new google.maps.Map(document.getElementById("map"), options);
      // $scope.cards = data.photos;
      $scope.cards = cardList.cards;

      //marker 숫자 제한하는 select 부분 listener등록 주석처리함
      // var numMarkers = document.getElementById('nummarkers');
      // google.maps.event.addDomListener(numMarkers, 'change', $scope.change);
      $scope.infoWindow = new google.maps.InfoWindow();

      $scope.showMarkers();

      // find me 넣기
      var findMe = document.getElementById('find-me');
      $scope.map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(findMe);

      /****************************** Serch box start ******************************/
      var input = document.getElementById('pac-input');
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

    $scope.showMarkers = function() {
      $scope.markers = [];

      var type = 1;
      if ($scope.usegmm.checked) {
        type = 0;
      }

      if ($scope.markerClusterer) {
        $scope.markerClusterer.clearMarkers();
      }

      //marker 숫자 제한하는 것 주석처리 함
      // var numMarkers = document.getElementById('nummarkers').value;
      // if(numMarkers > $scope.cards.length) numMarkers = $scope.cards.length;

      for (var i = 0; i < $scope.cards.length; i++) {

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

        var imageUrl = 'http://chart.apis.google.com/chart?cht=mm&chs=24x32&chco=' +
            'FFFFFF,008CFF,000000&ext=.png';
        var markerImage = new google.maps.MarkerImage(imageUrl,
            new google.maps.Size(24, 32));

        var marker = new google.maps.Marker({
          'position': latLng,
          'icon': markerImage
        });

        var fn = $scope.markerClickFunction($scope.cards[i], latLng);
        google.maps.event.addListener(marker, 'click', fn);
        google.maps.event.addDomListener(title, 'click', fn);
        $scope.markers.push(marker);
      }

      window.setTimeout($scope.time, 0);
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

    $scope.change = function() {
      $scope.clear();
      $scope.showMarkers();
    };

    $scope.time = function() {

      if ($scope.usegmm.checked) {
        for (var i = 0, marker; marker = $scope.markers[i]; i++) {
          marker.setMap($scope.map);
        }
      } else {
        $scope.markerClusterer = new MarkerClusterer($scope.map, $scope.markers);
      }
    };
});
