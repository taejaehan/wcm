wcm.controller("HomeController", function($scope, $cordovaNetwork, $state, $cordovaCamera, $http, $timeout, $stateParams) {

  var cardList = JSON.parse(window.localStorage['cardList'] || '{}');

  var user;
  if (window.localStorage['user'] != null) {
    user = JSON.parse(window.localStorage['user'] || '{}');
    $scope.username = user.properties.nickname;
    $scope.userimage = user.properties.thumbnail_image;
    $scope.likes = user.properties.like;
  } 

  console.log(user);

  $scope.page = 0;
  $scope.cards = [];

  $scope.doRefresh = function() {

    if ($cordovaNetwork.isOnline) {

    /* isOnline */  
      $timeout( function() {

        var request = $http({
            method: "get",
            url: mServerAPI + "/card/" + $scope.page,
            crossDomain : true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            cache: false
        });

        request.success(function(data) {

          for (var i = 0; i <  data.cards.length; i++) {

            if (data.cards[i].status === "0") {
              data.cards[i].statusDescription = "프로젝트가 등록되었습니다.";
            } else if (data.cards[i].status === "33") {
              data.cards[i].statusDescription = "프로젝트가 시작되었습니다.";
            } else if (data.cards[i].status === "66") {
              data.cards[i].statusDescription = "프로젝트를 진행합니다.";
            } else {
              data.cards[i].statusDescription = "프로젝트가 완료되었습니다.";
            }

            var object =  data.cards[i];
            $scope.cards.push(object);
          }

          $scope.page++;
          $scope.$broadcast('scroll.infiniteScrollComplete');  
        });

        //Stop the ion-refresher from spinning
        $scope.$broadcast('scroll.refreshComplete');  
      }, 1000);
  
    } else {

    /* isOffline */
      alert("Check your network connection.");

      for (var i = 0; i < cardList.cards.length; i++) {
        var object = cardList.cards[i];
        $scope.cards.push(object);
      }
    }
  }

  $scope.findWarning = function() {
    $state.go("tabs.map");
  }

  
  // =========================== Check current user & card user =============================

  $scope.userChecked = function(card) {

    if (user != null) {
      if ( parseInt(card.user[0].user_id) === user.id ) {
        return { 'display' : 'inline-block' };
      } else {
        return { 'display' : 'none' };
      }
    } else {
      return { 'display' : 'none' }
    }
  }

  // ========================= Check current user & card user END ===========================

  // ==================================== Delete card ======================================  

  $scope.deleteCard = function(id) {
  
    if (confirm('Are you sure you want to delete?')) {
      var request = $http({
          method: "get",
          url: mServerAPI + "/cardDetail/" + id + "/delete",
          crossDomain : true,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
      });

      request.success(function() {
        location.reload();
      });
    } else {
      
    }
  }
  
  // ==================================== Delete card END ======================================  
  

});




