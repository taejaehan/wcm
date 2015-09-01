wcm.controller("HomeController", function($scope, $state, $cordovaCamera, $http, $timeout) {
    
    $scope.$on('$ionicView.afterEnter', function(){
      $scope.doRefresh();
    });

    $scope.doRefresh = function() {
    
      console.log('Refreshing!');
      $timeout( function() {
        var request = $http({
            method: "get",
            url: mServerAPI + "/card",
            crossDomain : true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            cache: false
        });

        $scope.cards = [];
        /* Successful HTTP post request or not */
        request.success(function(data) {
            for (var i = 0; i <  data.cards.length; i++) {
                var object =  data.cards[i];
                // console.log(object.id + ' - ' + object.title + " " + object.description);
                $scope.cards.push(object);
            }
        });

        //Stop the ion-refresher from spinning
        $scope.$broadcast('scroll.refreshComplete');
      
      }, 1000);
    };
});