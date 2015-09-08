wcm.controller("HomeController", function($scope, $state, $cordovaCamera, $http, $timeout, $stateParams) {
  

  $scope.$on('$ionicView.afterEnter', function(){
    $scope.doRefresh();
  });

  // $scope.watch = false;
  $scope.page = 0;
  $scope.cards = [];


  if (window.localStorage['user'] != null) {

    var user = JSON.parse(window.localStorage['user'] || '{}');
    $scope.username = user.properties.nickname;
    $scope.userimage = user.properties.thumbnail_image;
  }
  

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
              $scope.cards.push(object);
          }

          $scope.page++;
          $scope.$broadcast('scroll.infiniteScrollComplete');
      });

      //Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');  
    }, 1000);
  };


  console.log($scope.watch);

});











