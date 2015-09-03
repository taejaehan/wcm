wcm.controller("HomeController", function($scope, $state, $cordovaCamera, $http, $timeout) {
  
  var user = JSON.parse(window.localStorage['user'] || '{}');
  
  $scope.$on('$ionicView.afterEnter', function(){
    $scope.doRefresh();
  });

  $scope.page = 0;
  $scope.cards = [];
  $scope.username = user.properties.nickname;

  $scope.doRefresh = function() {
    
    console.log('Refreshing!');

    $timeout( function() {
      var request = $http({
          method: "get",
          url: mServerAPI + "/card/" + $scope.page,
          crossDomain : true,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          cache: false
      });

      /* Successful HTTP post request or not */
      request.success(function(data) {
          for (var i = 0; i <  data.cards.length; i++) {
              var object =  data.cards[i];
              // console.log(object.id + ' - ' + object.title + " " + object.description);
              $scope.cards.push(object);
          }
          $scope.page++;
      });

      //Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');  
    }, 1000);
  };

});
