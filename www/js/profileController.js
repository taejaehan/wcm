wcm.controller("ProfileController", function($scope) {
  
  var user = JSON.parse(window.localStorage['user'] || '{}');
  
	$scope.username = user.properties.nickname;
	$scope.userimage = user.properties.thumbnail_image;

});
