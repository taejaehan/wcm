wcm.controller("HomeController", function($scope, $cordovaNetwork, $state, $cordovaCamera, $http, $timeout, $stateParams) {

  var cardList = JSON.parse(window.localStorage['cardList'] || '{}');

  if (window.localStorage['user'] != null) {
    var user = JSON.parse(window.localStorage['user'] || '{}');
    $scope.username = user.properties.nickname;
    $scope.userimage = user.properties.thumbnail_image;
  }

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

            if (data.cards[i].userimage === "") {

              /* temporary code */
              var object =  data.cards[i];
              object.userimage = "https://lh3.googleusercontent.com/1K8PBYnhbpdHtiXNZqaMwbk_dCPkoSXMZMqJc-Ae0qvhr-Cpnx2ATu49eEkoXv_Ym75h1uNq7EbeS--_P2g02V-nU1tJcxEt6r5CfdtPvT8owFngb3OTyxr5APYg8YKDxAxM7Iw7HxtY37et0ZeT-InQnqoLrjNa-2BiHlwUnO95XpuIU286rakjG_0Y7Q0tRkeKwRDNp_kCMZeEXISzlVvOf-tIXIjdGxS4F6vZkmrvY7h98r0sUmp_yLZFAl120ZOHyezvHk_vetywZuA-63BFAJu9Iy59-DNkk3iK6umL5uO_hWzFL0oRk3d-VHQ_en1Vmey7_b39frnnxFkIpWvzj1GlAwJ1qysrWCx0HY2iuZbm0zNgIenw3yVzxIFyGT1Xy_jpjr6FU1QGVUkWxBb-3HpkPWUn7G4DS0YrsDmUSPARK3D9l01cUgYJD_jBR-Jdf895B7GWPRwNupZNulICfFw-VwoF8eVm4xaFSNcbgEANa0LXb75oHhJ6p0QnhACN0NcxZC4xk3nz3R5l_g=s160-no";
              object.username = "temporary name";
              $scope.cards.push(object);
              /* temporary code end */

            } else {
              var object =  data.cards[i];
              $scope.cards.push(object);
            }
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
  
  // =========================== Check current user & card user =============================

  $scope.userChecked = function(card) {

      if ( parseInt(card.user_id[0].user_id) === user.id ) {
        return { 'display' : 'inline-block' };
      } else {
        return { 'display' : 'none' };
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




