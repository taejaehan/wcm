wcm.service('CardService', function($state, $ionicPopup, $http, $window, $ionicLoading, $location, $rootScope, $timeout) {

  /*
  * watch 버튼을 toggle합니다 by tjhan 151111
  * @param e : (bool) 버튼 toggle true/false
  * @param id : watch 할 card id
  * @param user : watch할 user 정보
  */
  this.scrollPosition;
  this.sortType = 'registration';

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

        /********************watch 테이블에 추가 시작*******************/
        var userId = parseInt(user.userid);
        var postId = parseInt(id);
        var formData = {
              user_id: userId,
              post_id: postId,
              watch: e
        };
        var postData = 'watchData='+JSON.stringify(formData);
        var request = $http({
            method: "post",
            url: mServerAPI + "/toggleWatch",
            crossDomain : true,
            data: postData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            cache: false
        });
        request.error(function(error){
          console.log('add watch ERROR : ' + error);
          $ionicLoading.hide();
        });
        request.success(function(data) {
          console.log('add watch SUCCESS : ' + data);
          $ionicLoading.hide();

          //현재 card의 index를 찾음
          var i = 0;
          var cardIndex;
          while( i < $rootScope.allData.cards.length) {
            if ($rootScope.allData.cards[i].id === id) {
              cardIndex = i;
              break;
            }
            i ++;
          };

          //toggle 값에 따라 local데이터를 변경
          if (e === true) {
            //user의 watch에 추가
            if (user.watchs.indexOf(id) === -1) {
              user.watchs.push(id);
              window.localStorage['user'] = JSON.stringify(user);
            };
            //postController에서 들어올 경우 해당 view의 watch_count++
            if(scope != null){
              scope.watch_count ++;
            };
            $rootScope.allData.cards[cardIndex].watch_count ++;
            $rootScope.allData.cards[cardIndex].watch = true;
            postWatch(id, true);

          } else{
            //user의 watch에서 삭제
            if (user.watchs.indexOf(id) != -1) {
              var index = user.watchs.indexOf(id);
              user.watchs.splice(index, 1);
              window.localStorage['user'] = JSON.stringify(user);
            };
            //postController에서 들어올 경우 해당 view의 watch_count--
            if(scope != null){
              scope.watch_count --;
            };
            $rootScope.allData.cards[cardIndex].watch_count --;
            $rootScope.allData.cards[cardIndex].watch = false;
            postWatch(id, false);
          }
        });
        /********************watch 테이블에 추가 끝*******************/

      } else {  //user.isAuthenticated === true 가 아니라면
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
                $state.go("tabs.fblogin");
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
        return false;
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
      console.log('watch count SUCCESS : ' + data);
      $ionicLoading.hide();
    });
    request.error(function(error){
      console.log('watch count ERROR : ' + error);
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

    if(mIsWebView){
      if(mIsIOS) {
        var scheme = 'fb://';
      }
      else if(mIsAndroid) {
        var scheme = 'com.facebook.katana';
      }

      console.log('share card : ' + JSON.stringify(card));

      $ionicLoading.show({
        template: '<ion-spinner icon="bubbles"></ion-spinner>'
      });

      appAvailability.check(
        scheme,       // URI Scheme or Package Name
        function() {  // Success callback
          console.log(scheme + ' is available :)');
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
              caption: card.title,
              description: card.description,
              // message:'First photo post',
              // name: card.description,
              // link: 'http://wechangemakers.org/'
              link : mFacebookUrl + '?post' + card.id
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

                  //share는 무조건 숫자가 증가 되기 때문에 postData를 보내지 않고 서버에서 처리 by tjhan 151111
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
              $ionicLoading.hide();

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
              $ionicLoading.hide();
              $ionicPopup.alert({
                title: mAppName,
                template: '페이스북 공유에 실패 하였습니다',
                cssClass: 'wcm-error',
              });
            });
          } //if(type =='facebook') 끝
        },
        function() {  // Error callback
          console.log(scheme + ' is not available :(');
          $ionicLoading.hide();
          $ionicPopup.alert({
            title: mAppName,
            template: '위험 공유를 하려면 페이스북 앱을 설치하세요',
            cssClass: 'wcm-error',
          });
          return;
        }

      ); // appAvailability.check 끝
    } //f(mIsWebView) 끝
  }; // share 끝

  var status = function(params, num) {
    if (params[num].status === PROGRESS_START) {
      params[num].statusDescription = PROGRESS_START_TEXT;
      params[num].statusIcon = "project-start";
    } else if (params[num].status === PROGRESS_ONGOING) {
      params[num].statusDescription = PROGRESS_ONGOING_TEXT;
      params[num].statusIcon = "project-ongoing";
    } else {
      params[num].statusDescription = PROGRESS_COMPLETED_TEXT;
      params[num].statusIcon = "project-complete";
    }
  };

  return {
    toggleWatch: toggleWatch,
    weChange: weChange,
    share: share,
    scrollPosition: this.scrollPosition,
    sortType: this.sortType,
    status: status
  };
})
