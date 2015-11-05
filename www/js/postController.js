wcm.controller("PostController", function($scope, $rootScope, $http, $stateParams, $state, $ionicPopup, $ionicModal, CardService) {

  var latlng, progress;
  var user = JSON.parse(window.localStorage['user'] || '{}');

  $scope.postId = $stateParams.postId;
  $scope.comments = [];
  $scope.changers = [];
  $scope.duplicatedArray = [];
  $scope.comments_count = 0;

  $scope.$on('$ionicView.afterEnter', function(){
    $scope.changerImage = false;
    
    var request = $http({
      method: "get",
      url: mServerAPI + "/cardDetail/" + $scope.postId,
      crossDomain : true,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      cache: false
    });

    request.success(function(data) {
      $scope.card = data.cards[0];
      if (data.cards[0].img_path == '') {
        $scope.card.img_path = mNoImage;
      }else {
        $scope.card.img_path = mServerUpload + data.cards[0].img_path;
      }
      // $scope.card.img_path = mServerUpload + $scope.card.img_path;
      $scope.like_count = data.cards[0].like_count;
      $scope.share_count = data.cards[0].share_count;

      $scope.createTime = moment(data.cards[0].create_time, "YYYY-MM-DD h:mm:ss").fromNow();

      latlng = new google.maps.LatLng($scope.card.location_lat, $scope.card.location_long);
      progress = data.cards[0].status;


      if (data.cards[0].status === PROGRESS_START) {
        $scope.card.statusDescription = PROGRESS_START_TEXT;
        $scope.statusIcon = "project-start";
      } else if (data.cards[0].status ===PROGRESS_ONGOING) {
        $scope.card.statusDescription = PROGRESS_ONGOING_TEXT;
        $scope.statusIcon = "project-ongoing";
      } else if (data.cards[0].status ===PROGRESS_COMPLETED) {
        $scope.card.statusDescription = PROGRESS_COMPLETED_TEXT;
        $scope.statusIcon = "project-complete";
      }

      // 카드에 해당하는 change supporters 체크
      if (data.cards[0].changer.length != 0) {
        $scope.changerImage = true;
        
        if ($scope.changers.length === 0) {
          for(var j = 0; j < data.cards[0].changer.length; j++) {
            $scope.changers.push(data.cards[0].changer[j]);
          }
        } 
      } else {
        $scope.changerImage = false;
      }

      // user가 카드에 watch를 눌렀는지 체크
      if (user.isAuthenticated === true) {
        if( user.likes.length != 0) {
          var k = 0;

          while( k < user.likes.length) {
            if(user.likes.indexOf($scope.card.id) != -1) {
              $scope.card.watch = true;
              break;
            }
            $scope.card.watch = false;
            k++;
          }
        } else {
          $scope.card.watch = false;
        }
      } else {
        $scope.card.watch = false;
      }

    });
    

    // 카드 코멘트 가져오기
    var request2 = $http({
        method: "get",
        url: mServerAPI + "/comments",
        crossDomain : true,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
        cache: false
    });

    request2.success(function(data) {
      for (var i = 0; i <  data.comments.length; i++) {
        var object =  data.comments[i];
        
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
    var result = CardService.toggleWatch(watch,$scope.postId,user);
    $scope.card.watch = result;
    if(result){
      $scope.like_count ++;
    }else{
      $scope.like_count --;
    }
  }
  
  // 코멘트 db에 저장하기
  $scope.addComment =function() {
    
    if (user.isAuthenticated === true) {
      var comment = document.getElementById("comment").value;
      if ( comment === "" ) {
        $ionicPopup.alert({
          title: mAppName,
          template: '내용을 입력하세요',
          cssClass: 'wcm-negative',
        });
      } else {
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

        var request = $http({
            method: "post",
            url: mServerAPI + "/comments",
            crossDomain : true,
            data: postData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            cache: false
        });

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
                            }

        $scope.comments.push(formDataLocal);

        request.success(function(data) {  
          
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
        var request = $http({
            method: "get",
            url: mServerAPI + "/comment/" + comment.id + "/delete",
            crossDomain : true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
        });

        request.success(function() {

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
        
        var userId = parseInt(user.userid);
        var postId = parseInt($stateParams.postId);
        var formData =  { user_id: userId,
                          post_id: $stateParams.postId
                        };
        var postData = 'changeData='+JSON.stringify(formData);

        var request = $http({
            method: "post",
            url: mServerAPI + "/changes",
            crossDomain : true,
            data: postData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            cache: false
        });

        user.changes.push($stateParams.postId);
        window.localStorage['user'] = JSON.stringify(user);
        $scope.changers.push(changerObject);
        $scope.changerImage = true;
      }
    });
  }

  var changerObject = {
                        user_id: String(user.userid),
                        changeUser: [{
                          userimage: user.userimage,
                          username: user.username
                        }]
                      };


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
    var result = CardService.share('facebook', card);
    console.log('showDialog result : ' + result);
    if(result) $scope.share_count ++;

    /*facebookConnectPlugin.showDialog( {
      method: "feed" ,
      picture: card.img_path,
      name: card.title,
      message:'First photo post',    
      caption: 'via We Change Makers',
      description: card.description,
      link: 'http://wechangemakers.org/'
    }, 
      // function (response) { alert(JSON.stringify(response)) },
      // function (response) { alert(JSON.stringify(response)) }
      function (success) {
        $ionicPopup.alert({
          title: mAppName,
          template: '페이스북에 공유 되었습니다',
          cssClass: 'wcm-positive',
        });

        $scope.share_count ++;
        var share_count = $scope.share_count;
        var formData = { share_count: share_count };
        var postData = 'shareData='+JSON.stringify(formData);

        var request = $http({
            method: "post",
            url: mServerAPI + "/cardDetail/" + $scope.postId + "/share",
            crossDomain : true,
            data: postData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            cache: false
        });
      },
      function (error) {
        console.log(JSON.stringify(error));
        $ionicPopup.alert({
          title: mAppName,
          template: '페이스북 공유에 실패 하였습니다',
          cssClass: 'wcm-error',
        });
      }
    );*/
  }

});



