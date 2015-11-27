wcm.controller("WelcomeController", function($scope, $state, $http ,$cordovaOauth, AuthService, $window, $cordovaPreferences, $ionicLoading, $ionicPopup, $timeout) {

  console.log('user : ' + window.localStorage['user']);

  $scope.facebookLogin = function(){
    console.log('facebookLogin');
    AuthService.login('facebook');
  }

  $scope.skipLogin =function() {
    AuthService.skipLogin();
  }
  
  $scope.terms = function() {
    $state.go("tabs.terms");
  }

  $scope.termsGps = function() {
    $state.go("tabs.terms_gps");
  }

  $scope.privacy = function() {
    $state.go("tabs.privacy");
  }
});
