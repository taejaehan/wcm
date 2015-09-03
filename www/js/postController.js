wcm.controller("PostController", function($scope, $http, $stateParams) {
  
	$scope.postId = $stateParams.postId;
  $scope.cards = [];

  var request = $http({
    method: "get",
    url: mServerAPI + "/cardDetail/" + $scope.postId,
    crossDomain : true,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    cache: false
  });

  request.success(function(data) {

    $scope.postTitle = data.cards[0].title;
    $scope.postDescription = data.cards[0].description;
    $scope.postImage = data.cards[0].img_path;
    $scope.lat = data.cards[0].location_lat;
    $scope.lng = data.cards[0].location_long;
    $scope.initMap(data);
  });

  $scope.initMap = function(data) {
	  var map = new google.maps.Map(document.getElementById('map'), {
	    zoom: 8,
	    center: {lat: Number(data.cards[0].location_lat), lng: Number(data.cards[0].location_long)}
	  });
	  var geocoder = new google.maps.Geocoder;
	  var infowindow = new google.maps.InfoWindow;

	  $scope.geocodeLatLng(geocoder, map, infowindow);

	}

	$scope.geocodeLatLng = function(geocoder, map, infowindow) {
	  // var input = document.getElementById('latlng').value;
	  // var latlngStr = input.split(',', 2);
	  // var latlng = {lat: parseFloat(latlngStr[0]), lng: parseFloat(latlngStr[1])};

	  var latlng = { lat: parseFloat($scope.lat), lng: parseFloat($scope.lng) };

	  geocoder.geocode({'location': latlng}, function(results, status) {
	    if (status === google.maps.GeocoderStatus.OK) {
	      if (results[1]) {
	        map.setZoom(11);
	        var marker = new google.maps.Marker({
	          position: latlng,
	          map: map
	        });
	        
	        infowindow.setContent(results[1].formatted_address);
	        infowindow.open(map, marker);

	        $scope.address = results[1].formatted_address;
	        
	      } else {
	        window.alert('No results found');
	      }
	    } else {
	      window.alert('Geocoder failed due to: ' + status);
	    }
	  });
	}





});

