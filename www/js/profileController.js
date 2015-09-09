wcm.controller("ProfileController", function($scope, $state) {
  
  var user = JSON.parse(window.localStorage['user'] || '{}');
  
	$scope.username = user.properties.nickname;
	$scope.userimage = user.properties.thumbnail_image;

	$scope.logOut = function() {
		Kakao.Auth.logout(function(result){
			console.log(result);
			if (result) {
				$state.go('login');
			};
		});
	} 


});
