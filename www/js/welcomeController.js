wcm.controller("WelcomeController", function($scope, $state, $cordovaOauth) {

  $scope.buttonClick = function () {
    $cordovaOauth.facebook("1020667507964480", []).then(function(result) {
          console.log(JSON.stringify(result));
          $state.go("tabs.home");
      }, function(error) {
          console.log(error);
          $state.go("tabs.home");
      });
    }
});
