wcm.controller('MapController', function($scope, $stateParams, $cordovaGeolocation, $ionicLoading, $compile, $ionicHistory) {

    var map , marker, infowindow;
    $scope.$on('$ionicView.afterEnter', function(){
      if($ionicHistory.backView() != null && $ionicHistory.backView().stateName == "tabs.post"){
        $scope.showLocation();
        document.getElementById('pac-input').setAttribute('style' , 'display:none');
      }else{
        $scope.showLocation();
        $scope.setMapFuntions();
      }
    }); 
    $scope.showLocation = function(){
      //받아온 위/경도로 맵을 생성
      console.log('$stateParams.latlng : ' + $stateParams.latlng);
      console.log('$stateParams.progress : ' + $stateParams.progress);
      var latlngStr = $stateParams.latlng.slice(1,-1).split(',',2);
      var currentLatlng;
      if(latlngStr != ''){
        currentLatlng = {lat: parseFloat(latlngStr[0]), lng: parseFloat(latlngStr[1])};
      }else{
        currentLatlng = {lat : 37.574515, lng : 126.976930};
      }
      var mapOptions = {
        'zoom': 16, //init
        'minZoom' : 4,
        'center': currentLatlng,
        'mapTypeId': google.maps.MapTypeId.ROADMAP,
        'mapTypeControl' : false,     //지도, 위성
        'streetViewControl' : false,   //거리뷰
        'panControl' : false,           //위치 조절 pan
        'zoomControl' : false,         //확대/축소 pan
      };
      map = new google.maps.Map(document.getElementById("map-find"), mapOptions);

      var imageUrl;
      switch($stateParams.progress){
        case '0' :
        case '33' :
          imageUrl = '../img/location_r.png';
          break;
        case '66' :
          imageUrl = '../img/location_y.png';
          break;
        case '100' :
          imageUrl = '../img/location_g.png';
          break;
        default : 
          imageUrl = '../img/location_r.png';
      }
      var markerImage = new google.maps.MarkerImage(imageUrl,
        new google.maps.Size(50, 50),
        new google.maps.Point(0, 0),
        new google.maps.Point(15, 25),
        new google.maps.Size(50, 50));

      //marker를 생성
      marker = new google.maps.Marker({
        position: currentLatlng,
        map: map,
        title: 'Uluru (Ayers Rock)',
        draggable: false,
        icon : markerImage
      });

       // Marker + infowindow + angularjs compiled ng-click
      var contentString = "<div><a ng-click='clickTest()'></a></div>";
      var compiled = $compile(contentString)($scope);

      infowindow = new google.maps.InfoWindow({
        content: compiled[0]
      });
      // google.maps.event.addListener(marker, 'click', function() {
      //   infowindow.open(map,marker);
      // });
      $scope.setLocationName(currentLatlng);
    }
    $scope.setMapFuntions = function(){
      marker.draggable = true;

      //marker dragend listener
      google.maps.event.addListener(marker, 'dragend', function() { 
        var latlng = marker.getPosition();
        var movedLatlng = {lat: latlng.H,  lng: latlng.L};
        $scope.setLocationName(movedLatlng);
      });
      // find me 넣기
      var findMe = document.getElementById('find-me');
      map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(findMe);

       // serch 박스 넣기
      var input = document.getElementById('pac-input');
      var searchBox = new google.maps.places.SearchBox(input);
      map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

      // Bias the SearchBox results towards current map's viewport.
      map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
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
          // var icon = {
          //   url: place.icon,
          //   size: new google.maps.Size(71, 71),
          //   origin: new google.maps.Point(0, 0),
          //   anchor: new google.maps.Point(17, 34),
          //   scaledSize: new google.maps.Size(25, 25)
          // };

          marker.setOptions({
            map: map,
            // icon: icon,
            title: place.name,
            draggable: true,
            position: place.geometry.location,
            animation: google.maps.Animation.DROP,
          });

          var searchedLatlng = {lat: place.geometry.location.H , lng: place.geometry.location.L};
          $scope.setLocationName(searchedLatlng);

          if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
          } else {
            bounds.extend(place.geometry.location);
          }
        });
        map.fitBounds(bounds);
      });

      $scope.map = map;
    }
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

            marker.setOptions({
              position: myLatlng,
              animation: google.maps.Animation.DROP,
            });         
             
            map.setOptions(mapOptions);    

            $scope.setLocationName(myLatlng);

            $scope.map = map;   
            $ionicLoading.hide();           
             
        }, function(err) {
            $ionicLoading.hide();
            alert('You can not use the location information');
            console.log('CURRENT LOCATION ERROR :  ' + err);
        });
    }

    //마커 상단에 위치 이름 표시
    $scope.setLocationName = function(latlng) {
      var geocoder = new google.maps.Geocoder;
      geocoder.geocode({'location': latlng}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          if (results[1]) {
            map.setZoom(16);
            marker.setOptions({
              position: latlng,
              map: map
            });
            infowindow.setContent(results[1].formatted_address);
            infowindow.open(map, marker);
            console.log('lat : ' + latlng.lat);
            console.log('lng : ' + latlng.lng);

            if(document.getElementById("card_location") != null){
              document.getElementById("card_location").value = results[1].formatted_address;
              document.getElementById("card_location").setAttribute('lat' , latlng.lat);
              document.getElementById("card_location").setAttribute('long' , latlng.lng);
              document.getElementById("card_location").validity.valid = true;
            }
            
          } else {
            window.alert('No results found');
          }
        } else {
          window.alert('Geocoder failed due to: ' + status);
        }
      });
    }
                  
});
