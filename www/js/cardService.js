wcm.service('CardService', function($state, $ionicPopup, $http, $window, $ionicLoading, $location, $rootScope, $timeout) {

  /*
  * watch 버튼을 toggle합니다 by tjhan 151111
  * @param e : (bool) 버튼 toggle true/false
  * @param id : watch 할 card id
  * @param user : watch할 user 정보
  */
  var toggleWatch = function(e, id, user, scope) {
    console.log('toggleWatch : ' + e);
    if(user != null){
      if (user.isAuthenticated === true) {
        $ionicLoading.show({
          template: '<ion-spinner icon="bubbles"></ion-spinner>'
        });
        //5초 뒤에 $ionicLoading.hide()
        $timeout(function(){
          $ionicLoading.hide();
        }, 5000);

        if (e === true) {
          var i = 0;
          while( i < $rootScope.allData.cards.length) {
            if ($rootScope.allData.cards[i].id === id) {
              $rootScope.allData.cards[i].watch_count ++;
              $rootScope.allData.cards[i].watch = true;
              postWatch(id, true);
              break;
            }
            i ++;
          }
          //watch 테이블에 추가
          if (user.watchs.indexOf(id) === -1) {
            user.watchs.push(id);
            window.localStorage['user'] = JSON.stringify(user);
            var userId = parseInt(user.userid);
            var postId = parseInt(id);
            var formData1 = { user_id: userId,
                              post_id: postId
                            };
            var postData1 = 'watchData='+JSON.stringify(formData1);
            var request1 = $http({
                method: "post",
                url: mServerAPI + "/watch",
                crossDomain : true,
                data: postData1,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
                cache: false
            });
            if(scope != null){
              scope.watch_count ++;
            }
          }
          
        } else {
          var i = 0;
          while( i < $rootScope.allData.cards.length) {
            if ($rootScope.allData.cards[i].id === id) {
              $rootScope.allData.cards[i].watch_count --;
              $rootScope.allData.cards[i].watch = false;
              postWatch(id, false);
              break;
            }
            i ++;
          }
          //watch 테이블에서 삭제
          if (user.watchs.indexOf(id) != -1) {
            var index = user.watchs.indexOf(id);
            user.watchs.splice(index, 1);
            window.localStorage['user'] = JSON.stringify(user);
            var userId = parseInt(user.userid);
            var postId = parseInt(id);
            var formData1 = { user_id: userId,
                              post_id: postId
                            };
            var postData1 = 'watchData='+JSON.stringify(formData1);
            var request1 = $http({
                method: "post",
                url: mServerAPI + "/watch/delete/" + userId + "/" + postId,
                crossDomain : true,
                data: postData1,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
                cache: false
            });
            if(scope != null){
              scope.watch_count --;
            }
          }
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
  /*
  * 카드 테이블에 watch count를 변경합니다 by tjhan 151111
  * @param id - watch한 카드 id
  * @param watch (boolean) - watch true/false
  */
  var postWatch = function(id, watch){
    console.log('postWatch');
    // var watch_count = parseInt(selectedCard.watch_count);
    // var formData = { watch_count: watch_count };
    // var postData = 'watchData='+JSON.stringify(formData);
    // var id = selectedCard.id;
    var formData = { watch: watch };
    var postData = 'watch='+JSON.stringify(formData);

    var request = $http({
        method: "post",
        url: mServerAPI + "/cardDetail/" + id + "/watch",
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
  /*
  * sns로 공유합니다. (현재 facebook만 있음) by tjhan 151111
  * @param type (String) - sns type (ex : 'facebook')
  * @param card : 공유 할 card 정보 (ex :  {"id":"5","user_id":"2","title":"위험해요",,,,,,,,,})
  * @param scope : postController의 $scope (해당 scope의 share_count를 증가시키기 위함)
  */
  var share = function(type, card, scope) {

    console.log('share type : ' + type);
    console.log('share card : ' + JSON.stringify(card));
    if(type =='facebook'){

      var fileurl = card.img_path;
      if(fileurl == '' || fileurl == mNoImage || fileurl == mNoImageThumb){
        console.log('That image was not found.');
        $ionicPopup.alert({
          title: mAppName,
          template: '이미지가 없어서 공유할 수 없습니다',
          cssClass: 'wcm-error',
        });
        return;
      }else{
        console.log('That image was found.');
      }

      return facebookConnectPlugin.showDialog({
        method: "feed" ,
        picture: card.img_path,
        message:'First photo post',    
        caption: card.title,
        name: card.description,
        description: card.description,
        link: 'http://wechangemakers.org/'
      }, 
      function (success) {
        console.log('share success');
        var i = 0;
        while( i < $rootScope.allData.cards.length) {
          if ($rootScope.allData.cards[i].id === card.id) {
            console.log('share $rootScope.allData.cards[i].share_count : ' + $rootScope.allData.cards[i].share_count);
            var share_count = ++($rootScope.allData.cards[i].share_count);
            console.log('share card.id : ' + card.id);
            console.log('share share_count : ' + share_count);

            // var formData = { share_count: share_count };
            // var postData = 'shareData='+JSON.stringify(formData);

            //share는 무조건 숫자가 증가 되기 때문에 postData를 보내지 않는다 by tjhan 151111
            var request = $http({
                method: "post",
                url: mServerAPI + "/cardDetail/" + card.id + "/share",
                crossDomain : true,
                // data: postData,
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
        //postController에서 넘어온 scope이 있을 경우 해당 scope의 share_count를 증가
        if(scope != null){
          scope.share_count ++;
        }
      },
      function (error) {
        console.log('share error : ' + JSON.stringify(error));
        $ionicPopup.alert({
          title: mAppName,
          template: '페이스북 공유에 실패 하였습니다',
          cssClass: 'wcm-error',
        });
      });
    } //if(type =='facebook') 끝
  };

  return {
    toggleWatch: toggleWatch,
    weChange: weChange,
    share: share
  };
})