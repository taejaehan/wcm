wcm.service('CardService', function($state, $ionicPopup, $http, $window, $ionicLoading, $location, $rootScope, $timeout) {

  var toggleWatch = function(e, id, user) {
    console.log('toggleWatch : ' + e);
    if(user != null){
      if (user.isAuthenticated === true) {
        var loading = $ionicLoading.show({
          template: '<ion-spinner icon="bubbles"></ion-spinner>'
        });
        $timeout(function(){
          loading.hide();
        }, 5000);
        if (e === true) {
          if (user.likes.indexOf(id) === -1) {
            user.likes.push(id);
            window.localStorage['user'] = JSON.stringify(user);
            var userId = parseInt(user.userid);
            var postId = parseInt(id);
            var formData1 = { user_id: userId,
                              post_id: postId
                            };
            var postData1 = 'likeData='+JSON.stringify(formData1);

            var request1 = $http({
                method: "post",
                url: mServerAPI + "/like",
                crossDomain : true,
                data: postData1,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
                cache: false
            });
          }
          var i = 0;
          while( i < $rootScope.allData.cards.length) {
            if ($rootScope.allData.cards[i].id === id) {
              $rootScope.allData.cards[i].like_count ++;
              $rootScope.allData.cards[i].watch = true;
              postWatch($rootScope.allData.cards[i], id);
              break;
            }
            i ++;
          }

          return true;
        } else {
          if (user.likes.indexOf(id) != -1) {
            var index = user.likes.indexOf(id);
            user.likes.splice(index, 1);
            window.localStorage['user'] = JSON.stringify(user);
            var userId = parseInt(user.userid);
            var postId = parseInt(id);
            var formData1 = { user_id: userId,
                              post_id: postId
                            };
            var postData1 = 'likeData='+JSON.stringify(formData1);
            var request1 = $http({
                method: "post",
                url: mServerAPI + "/like/delete/" + userId + "/" + postId,
                crossDomain : true,
                data: postData1,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
                cache: false
            });
          }
          var i = 0;
          while( i < $rootScope.allData.cards.length) {
            if ($rootScope.allData.cards[i].id === id) {
              $rootScope.allData.cards[i].like_count --;
              $rootScope.allData.cards[i].watch = false;
              postWatch($rootScope.allData.cards[i], id);
              break;
            }
            i ++;
          }

          return false;
        }

      } else {
        $ionicPopup.show({
          template: '로그인 후에 이용 가능합니다',
          title: mAppName,
          cssClass: 'wcm-positive',
          buttons: [
            { text: '나중에하기' },
            {
              text: '<b>로그인하기</b>',
              type: 'button-positive',
              onTap: function(e) {
                $state.go("fblogin");
              }
            }
          ]
        });
        var i = 0;
        while( i < $rootScope.allData.cards.length) {
          if ($rootScope.allData.cards[i].id === id) {
            $rootScope.allData.cards[i].watch = false;
            break;
          }
          i ++;
        }
      }
    }
  };
  var postWatch = function(selectedCard, id){
    console.log('postWatch');
    var like_count = parseInt(selectedCard.like_count);
    var formData = { like_count: like_count };
    var postData = 'likeData='+JSON.stringify(formData);

    var request = $http({
        method: "post",
        url: mServerAPI + "/cardDetail/" + id + "/like",
        crossDomain : true,
        data: postData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
        cache: false
    });
    request.success(function(data) {
      console.log('SUCCESS : ' + data);
      $ionicLoading.hide();
    });
    request.error(function(error){
      console.log('ERROR : ' + error);
      $ionicLoading.hide();
    });
  }

  var weChange = function() {
    
  };
  var share = function(type, card) {

    var fbSuccess = function (success) {
      console.log('share success');
      var i = 0;
      while( i < $rootScope.allData.cards.length) {
        if ($rootScope.allData.cards[i].id === card.id) {
          var share_count = $rootScope.allData.cards[i].share_count ++;
          var formData = { share_count: share_count };
          var postData = 'shareData='+JSON.stringify(formData);

          var request = $http({
              method: "post",
              url: mServerAPI + "/cardDetail/" + card.id + "/share",
              crossDomain : true,
              data: postData,
              headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
              cache: false
          });
          request.success(function(data) {
            console.log('shareCountPost success : ' + JSON.stringify(data));
          });
          request.error(function(error){
            console.log('shareCountPost error : ' + JSON.stringify(error));
          });
          break;
        }
        i ++;
      }

      $ionicPopup.alert({
        title: mAppName,
        template: '페이스북에 공유 되었습니다',
        cssClass: 'wcm-positive',
      });

      return true;          
    };
    var fbError = function (error) {
      console.log('error : ' + JSON.stringify(error));
      $ionicPopup.alert({
        title: mAppName,
        template: '페이스북 공유에 실패 하였습니다',
        cssClass: 'wcm-error',
      });
      return false;
    }
    console.log('share type : ' + type);
    if(type =='facebook'){
      facebookConnectPlugin.showDialog({
          method: "feed" ,
          picture: card.img_path,
          name: card.title,
          message:'First photo post',    
          caption: 'via We Change Makers',
          description: card.description,
          link: 'http://wechangemakers.org/'
        }, fbSuccess,fbError
      );
    } //if(type =='facebook') 끝
  };

  return {
    toggleWatch: toggleWatch,
    weChange: weChange,
    share: share
  };
})