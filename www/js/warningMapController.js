wcm.controller('WarningMapController', function($scope, $stateParams, $cordovaGeolocation, $ionicLoading, $compile) {
    

    var speedTest = {};
    speedTest.pics = null;
    speedTest.map = null;
    speedTest.markerClusterer = null;
    speedTest.markers = [];
    speedTest.infoWindow = null;

    $scope.$on('$ionicView.afterEnter', function(){
      speedTest.init();
    });

    speedTest.init = function() {

      var latlng = new google.maps.LatLng(37.574515, 126.976930);
      var options = {
        'zoom': 13,
        'center': latlng,
        'mapTypeId': google.maps.MapTypeId.ROADMAP
      };

      var cardList = JSON.parse(window.localStorage['cardList'] || '{}');

      // for (var i = 0; i < cardList.cards.length; i++) {
      //   var object = cardList.cards[i];
      //   $scope.cards.push(object);
      // }

      speedTest.map = new google.maps.Map(document.getElementById("map"), options);
      // speedTest.pics = data.photos;
      speedTest.pics = cardList.cards;
      

      var useGmm = document.getElementById('usegmm');
      google.maps.event.addDomListener(useGmm, 'click', speedTest.change);
      
      var numMarkers = document.getElementById('nummarkers');
      google.maps.event.addDomListener(numMarkers, 'change', speedTest.change);

      speedTest.infoWindow = new google.maps.InfoWindow();

      speedTest.showMarkers();
    };

    speedTest.showMarkers = function() {
      speedTest.markers = [];

      var type = 1;
      if (document.getElementById('usegmm').checked) {
        type = 0;
      }

      if (speedTest.markerClusterer) {
        speedTest.markerClusterer.clearMarkers();
      }

      // var panel = $('markerlist');
      // panel.innerHTML = '';
      var numMarkers = document.getElementById('nummarkers').value;

      if(numMarkers > speedTest.pics.length) numMarkers = speedTest.pics.length;
      
      for (var i = 0; i < numMarkers; i++) {

        var titleText = speedTest.pics[i].title;
        if (titleText === '') {
          titleText = 'No title';
        }

        var item = document.createElement('DIV');
        var title = document.createElement('A');
        title.href = '#';
        title.className = 'title';
        title.innerHTML = titleText;

        item.appendChild(title);
        // panel.appendChild(item);


        var latLng = new google.maps.LatLng(speedTest.pics[i].location_lat,
            speedTest.pics[i].location_long);

        var imageUrl = 'http://chart.apis.google.com/chart?cht=mm&chs=24x32&chco=' +
            'FFFFFF,008CFF,000000&ext=.png';
        var markerImage = new google.maps.MarkerImage(imageUrl,
            new google.maps.Size(24, 32));

        var marker = new google.maps.Marker({
          'position': latLng,
          'icon': markerImage
        });

        var fn = speedTest.markerClickFunction(speedTest.pics[i], latLng);
        google.maps.event.addListener(marker, 'click', fn);
        google.maps.event.addDomListener(title, 'click', fn);
        speedTest.markers.push(marker);
      }

      window.setTimeout(speedTest.time, 0);
    };

    speedTest.markerClickFunction = function(pic, latlng) {
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
        if(pic.user != null){
          if(pic.user.username != null){
            username = pic.user.username;
          }
        }

        var infoHtml = '<div class="info"><h3>' + title +
          '</h3><div class="info-body">' +
          '<a href="' + url + '"><img src="' +
          fileurl + '" class="info-img"/></a></div>' +
          // '<a href="http://www.panoramio.com/" target="_blank">' +
          // '<img src="http://maps.google.com/intl/en_ALL/mapfiles/' +
          // 'iw_panoramio.png"/></a><br/>' +
          '<a href="' + pic.userimage + '" target="_blank">' + username +
          '</a></div></div>';

        speedTest.infoWindow.setContent(infoHtml);
        speedTest.infoWindow.setPosition(latlng);
        speedTest.infoWindow.open(speedTest.map);
      };
    };

    speedTest.clear = function() {
      // $('timetaken').innerHTML = 'cleaning...';
      for (var i = 0, marker; marker = speedTest.markers[i]; i++) {
        marker.setMap(null);
      }
    };

    speedTest.change = function() {
      speedTest.clear();
      speedTest.showMarkers();
    };

    speedTest.time = function() {

      // $('timetaken').innerHTML = 'timing...';
      // var start = new Date();
      if (document.getElementById('usegmm').checked) {
        speedTest.markerClusterer = new MarkerClusterer(speedTest.map, speedTest.markers);
      } else {
        for (var i = 0, marker; marker = speedTest.markers[i]; i++) {
          marker.setMap(speedTest.map);
        }
      }

      // var end = new Date();
      // $('timetaken').innerHTML = end - start;
    };

    /*$scope.$on('$ionicView.afterEnter', function(){

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
           
          var options = {
              center: myLatlng,
              zoom: 16,
              mapTypeId: google.maps.MapTypeId.ROADMAP
          }; 

          var cardList = JSON.parse(window.localStorage['cardList'] || '{}');

          for (var i = 0; i < cardList.cards.length; i++) {
            var object = cardList.cards[i];
            $scope.cards.push(object);
          }
 
          var map = new google.maps.Map(document.getElementById("map"), options);
          var markers = [];
          for (var i = 0; i < cardList.cards.length; i++) {
            var object = cardList.cards[i];
            var latLng = new google.maps.LatLng(object.location_lat,object.location_long);
            // var latLng = new google.maps.LatLng(data.photos[i].latitude,
            //     data.photos[i].longitude);
            var imageUrl = 'http://chart.apis.google.com/chart?cht=mm&chs=24x32&chco=' + 'FFFFFF,008CFF,000000&ext=.png';
            var markerImage = new google.maps.MarkerImage(imageUrl,
                new google.maps.Size(24, 32));

            var marker = new google.maps.Marker({
              'position': latLng,
              'icon': markerImage
            });
            markers.push(marker);
          }
          var markerCluster = new MarkerClusterer(map, markers);

          $ionicLoading.hide();           
           
      }, function(err) {
          $ionicLoading.hide();
          console.log(err);
      });

    }); */

                  
});
