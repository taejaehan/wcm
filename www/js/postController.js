wcm.controller("PostController", function($scope, $rootScope, $http, $stateParams, $state, $ionicPopup, $ionicModal, CardService, $interval, $ionicLoading, $window, CardDetail) {

  var latlng, progress;
  var user = JSON.parse(window.localStorage['user'] || '{}');
  var swiper = new Swiper('.swiper-container', {
                  mode: 'horizontal',
                  pagination: '.swiper-pagination',
                  slidesPerView: ($window.innerWidth / 60).toFixed(1),
                  paginationClickable: true,
                  spaceBetween: 0,
                  freeMode: true,
                  observer : true
              });

  $scope.postId = $stateParams.postId;
  $scope.comments = [];
  $scope.changers = [];
  $scope.duplicatedArray = [];
  $scope.comments_count = 0;

  $scope.$on('$ionicView.beforeEnter', function(){

    $scope.changerImage = false;

    $ionicLoading.show({
      template: '<ion-spinner icon="bubbles"></ion-spinner><br/>로딩중..'
    });

    CardDetail.card($stateParams.postId, function(card) {
      $scope.card = card;
      if (card.img_path == '') {
        $scope.card.img_path = mNoImage;
      }else {
        $scope.card.img_path = mServerUpload + card.img_path;
      };

      //image height값 세팅 후 loading되면 $ionicLoading.hide() by tjhan 151123
      console.log('card.img_height : ' + card.img_height);
      if(card.img_height != null){
        document.getElementById("post_img").style.height = card.img_height +'px';
        var img = new Image();
        img.src = $scope.card.img_path;
        img.addEventListener("load", function(){
            $ionicLoading.hide();
        });
      }else{
        $ionicLoading.hide();
      }

      $scope.watch_count = card.watch_count;
      $scope.share_count = card.share_count;
      $scope.createTime = moment(card.create_time, "YYYY-MM-DD h:mm:ss").fromNow();
      latlng = new google.maps.LatLng($scope.card.location_lat, $scope.card.location_long);
      progress = card.status;

      if (card.status === PROGRESS_START) {
        $scope.card.statusDescription = PROGRESS_START_TEXT;
        $scope.statusIcon = "project-start";
      } else if (card.status ===PROGRESS_ONGOING) {
        $scope.card.statusDescription = PROGRESS_ONGOING_TEXT;
        $scope.statusIcon = "project-ongoing";
      } else if (card.status ===PROGRESS_COMPLETED) {
        $scope.card.statusDescription = PROGRESS_COMPLETED_TEXT;
        $scope.statusIcon = "project-complete";
      }

      // 카드에 해당하는 change supporters 체크
      if (card.changer.length != 0) {
        $scope.changerImage = true;
        if ($scope.changers.length === 0) {
          for(var j = 0; j < card.changer.length; j++) {
            $scope.changers.push(card.changer[j]);
          }
        }
      } else {
        $scope.changerImage = false;
      }

      // user가 카드에 watch를 눌렀는지 체크
      $scope.card.watch = false;
      if (user.isAuthenticated === true) {
        if( user.watchs.length != 0) {
          var k = 0;

          while( k < user.watchs.length) {
            if(user.watchs.indexOf($scope.card.id) != -1) {
              $scope.card.watch = true;
              break;
            }
            $scope.card.watch = false;
            k++;
          }
        }
      }
    });

    // 카드 코멘트 가져오기
    CardDetail.getComment(function(comments) {
      for (var i = 0; i <  comments.length; i++) {
        var object =  comments[i];

        if (object.post_id === $stateParams.postId) {
          if (object.username === null || object.userimage === null) {
            object.username = "no nickname";
            object.userimage = "http://mud-kage.kakao.co.kr/14/dn/btqchdUZIl1/FYku2ixAIgvL1O50eDzaCk/o.jpg"
            $scope.comments.push(object);
            $scope.comments_count ++;
          } else {
            $scope.comments.push(object);
            $scope.comments_count ++;
          }
        }
      }
    });
  });


  // toggle watch_count
  $scope.toggleWatchPost = function(watch) {
    var result = CardService.toggleWatch(watch,$scope.postId,user, $scope);
    if (result === false) {
      $scope.card.watch = false;
    }
  }

  // 코멘트 db에 저장하기
  $scope.addComment = function() {
    if (user.isAuthenticated === true) {
      var comment = document.getElementById("comment").value;
      if ( comment === "" ) {
        $ionicPopup.alert({
          title: mAppName,
          template: '내용을 입력하세요',
          cssClass: 'wcm-negative',
        });
      } else {
        $ionicLoading.show({
          template: '<ion-spinner icon="bubbles"></ion-spinner><br/>'
        });
        $scope.username = user.username;
        $scope.userimage = user.userimage;
        $scope.userid = String(user.userid);

        if ($scope.userimage === null) {
          $scope.userimage = "http://mud-kage.kakao.co.kr/14/dn/btqchdUZIl1/FYku2ixAIgvL1O50eDzaCk/o.jpg";
        }

        var post_id = parseInt($stateParams.postId);
        var user_app_id = parseInt(user.userid);

        var formData = {
                          post_id: post_id,
                          user_app_id: user_app_id,
                          content: comment
                        };

        var postData = 'commentData='+JSON.stringify(formData);
        var formDataLocal = {
                              post_id: post_id,
                              user_app_id: user_app_id,
                              content: comment,
                              user: [{
                                          user_id: $scope.userid,
                                          username: $scope.username,
                                          userimage: $scope.userimage
                                       }],
                              updated_at: new Date()
                            };

        CardDetail.addComment(postData, function(data){
          formDataLocal.id = data;
          $scope.comments.push(formDataLocal);
          document.getElementById("comment").value = "";
          $scope.comments_count ++;

          var i = 0;
          while( i < $rootScope.allData.cards.length) {
            if ($rootScope.allData.cards[i].id === $stateParams.postId) {
              $rootScope.allData.cards[i].comments_count ++;
              break;
            }
            i ++;
          }
        });
      }
    } else {
      var myPopup2 = $ionicPopup.show({
        template: "로그인 후에 이용 가능합니다",
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
      document.getElementById("comment").value = "";
    }
  }


  // 현재 로그인중인 user와 코멘트를 작성한 user 체크
  $scope.userChecked = function(comment) {
    if (user.isAuthenticated === true) {
      if ( parseInt(comment.user[0].user_id) == user.userid ) {
        return { 'display' : 'inline-block' };
      } else {
        return { 'display' : 'none' };
      }
    } else {
      return { 'display' : 'none' };
    }
  }


  // 코멘트 삭제하기
  $scope.deleteComment = function(comment) {
    var confirmPopup = $ionicPopup.confirm({
      title: mAppName,
      template: '댓글을 정말로 삭제하겠습니까?',
      cssClass: 'wcm-negative',
    });

    confirmPopup.then(function(res) {
      if(res) {
        $ionicLoading.show({
          template: '<ion-spinner icon="bubbles"></ion-spinner><br/>'
        });

        CardDetail.deleteComment(comment, function() {
          var index = $scope.comments.indexOf(comment);
          $scope.comments.splice(index, 1);
          $scope.comments_count --;

          var i = 0;
          while( i < $rootScope.allData.cards.length) {
            if ($rootScope.allData.cards[i].id === $stateParams.postId) {
              $rootScope.allData.cards[i].comments_count --;
              break;
            }
            i ++;
          }
        });
      }
    });
  }


  // Change Supporters 추가하기
  var ChangeMakerPost = function() {
    var confirmPopup = $ionicPopup.confirm({
      title: mAppName,
      template: 'ChangeMaker가 되어 해당 이슈를 해결하는데 참여하시겠습니까?',
      cssClass: 'wcm-positive',
    });
    confirmPopup.then(function(res) {
      if(res) {
        $ionicLoading.show({
          template: '<ion-spinner icon="bubbles"></ion-spinner>'
        });

        CardDetail.changeMakers(user, $stateParams.postId, function(changerObject) {
          $scope.changers.push(changerObject);
          $scope.changerImage = true;
        });
      }
    });
  }


  // Change Supporters 버튼 눌렀을때
  $scope.weChange = function() {

    if (user.isAuthenticated === true) {

      if ($scope.card.status == 100) {
        $ionicPopup.alert({
          title: mAppName,
          template: '프로젝트가 종료되었습니다',
          cssClass: 'wcm-negative'
        });

      } else {

        if ((user.changes.length === 0) || (user.changes.indexOf($stateParams.postId) === -1)) {
          ChangeMakerPost();

        } else {
          $ionicPopup.alert({
            title: mAppName,
            template: '이미 참여하셨습니다',
            cssClass: 'wcm-negative'
          });
        }
      }

    } else {
      var myPopup3 = $ionicPopup.show({
        template: "로그인 후에 이용 가능합니다",
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
    }

  }

  // Change Supporters 프로필 팝업
  $scope.openProfile = function(e) {
    $scope.changeMakerName = e.username;
    $scope.changeMakerImage = e.userimage;

    $ionicPopup.show({
      templateUrl : 'templates/popup.html',
      scope: $scope,
      cssClass: 'wcm-positive',
      buttons: [
       {
          text: '<b>Ok</b>',
          type: 'button-positive'
       },
      ]
    });
  }

  // 지도 보기
  $scope.showMap = function() {
    $state.go('tabs.location_h', { 'latlng': latlng, 'progress' : progress});
  }

  $scope.showDialog = function (card) {
    var  result = CardService.share('facebook', card, $scope);
  }

});
