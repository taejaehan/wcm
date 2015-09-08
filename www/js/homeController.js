wcm.controller("HomeController", function($scope, $state, $cordovaCamera, $http, $timeout) {
  
  $scope.show=true;

  $scope.$on('$ionicView.afterEnter', function(){
    $scope.doRefresh();
  });

  $scope.page = 0;
  $scope.cards = [];
  $scope.post_id = [];

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

              // /* get comments */
              // var request2 = $http({
              //     method: "get",
              //     url: mServerAPI + "/comment/" + object.id,
              //     crossDomain : true,
              //     headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
              //     cache: false
              
              // });       
                
              // console.log(object.id);
      
              // request2.success(function(data) {

              //   /* post comments length */
              //   var comments_count = parseInt(data.comments.length);
              //   var formData = { comments_count: comments_count };
              //   var postData = 'commentData='+JSON.stringify(formData);

              //   var request3 = $http({
              //       method: "post",
              //       url: mServerAPI + "/cardDetail/" + object.id,
              //       crossDomain : true,
              //       data: postData,
              //       headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
              //       cache: false
              //   });
              //   /* post comments length end */

              // });

              // /* get comments end */
          }
          

          $scope.page++;
          $scope.$broadcast('scroll.infiniteScrollComplete');
      });

      //Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');  
    }, 1000);
  };


});
