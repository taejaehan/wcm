wcm.controller("WelcomeController", function($scope, $state, $http ,$cordovaOauth, AuthService, $window, $cordovaPreferences, $ionicLoading, $ionicPopup, $timeout) {

  console.log('user : ' + window.localStorage['user']);

  $scope.facebookLogin = function(){
    console.log('facebookLogin');
    AuthService.login('kakao');
  }

  $scope.skipLogin =function() {
    AuthService.skipLogin();
  }
});
