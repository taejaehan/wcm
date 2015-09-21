wcm.controller("PostController", function($scope, $rootScope, $http, $stateParams, $state, $ionicPopup) {
  
  var latlng, progress;
  var localCard = JSON.parse(window.localStorage['localCard'] || '{}');
  var user;
  if(window.localStorage['user'] != null){
    user = JSON.parse(window.localStorage['user']);
  }else{
    user = {"id":57421548,"properties":{"nickname":"Taejae Han","thumbnail_image":"http://mud-kage.kakao.co.kr/14/dn/btqch17TnPq/Ve843fr4kMziXkSIjFwKI0/o.jpg","profile_image":"http://mud-kage.kakao.co.kr/14/dn/btqch02eQsy/PhRrVTx9KwvhxovXQk6Lek/o.jpg","like":[]},"isAuthenticated":true}
  }

  $scope.postId = $stateParams.postId;
  $scope.cards = [];
  $scope.comments = [];
  $scope.changers = [];
  $scope.comments_count = 0;
  // $scope.like_count = [];

  $scope.$on('$ionicView.afterEnter', function(){
    var request = $http({
      method: "get",
      url: mServerAPI + "/cardDetail/" + $scope.postId,
      crossDomain : true,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      cache: false
    });

    request.success(function(data) {

      $scope.cardTitle = data.cards[0].title; 
      $scope.postTitle = data.cards[0].title;
      $scope.postDescription = data.cards[0].description;
      if(data.cards[0].img_path == ''){
        data.cards[0].img_path = mNoImage;
      }else{
        data.cards[0].img_path = mServerUrl + data.cards[0].img_path;
      }
      $scope.postImage = data.cards[0].img_path;
      $scope.lat = data.cards[0].location_lat;
      $scope.lng = data.cards[0].location_long;
      latlng = new google.maps.LatLng($scope.lat, $scope.lng);
      $scope.like_count = data.cards[0].like_count;
      $scope.status = data.cards[0].status;
      $scope.setLocationName();
      progress = data.cards[0].status;
      if (data.cards[0].status === "0") {
        data.cards[0].statusDescription = "프로젝트가 등록되었습니다.";
      } else if (data.cards[0].status === "33") {
        data.cards[0].statusDescription = "프로젝트가 시작되었습니다.";
      } else if (data.cards[0].status === "66") {
        data.cards[0].statusDescription = "프로젝트를 진행합니다.";
      } else {
        data.cards[0].statusDescription = "프로젝트가 완료되었습니다.";
      }

      $scope.statusDescription = data.cards[0].statusDescription;

      var i = 0;
      
      while( i < $rootScope.allData.cards.length) {
        if ($rootScope.allData.cards[i].id === data.cards[0].id) {
          $scope.card = $rootScope.allData.cards[i];
          $scope.watch = $rootScope.allData.cards[i].watch;
          break;
        }
        i ++;
      }

      $scope.changers.push(data.cards[0].changer);
    });
    
    // ==================================== Get comments ======================================
    var request2 = $http({
        method: "get",
        url: mServerAPI + "/comments",
        crossDomain : true,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
        cache: false
    });

    /* Successful HTTP post request or not */
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
    // ==================================== Get comments END ======================================

  });
  
  // ==================================== reverse geocording ======================================

  $scope.setLocationName = function() {

    var latlng = { lat: parseFloat($scope.lat), lng: parseFloat($scope.lng) };
    var geocoder = new google.maps.Geocoder;

    geocoder.geocode({'location': latlng}, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          $scope.address = results[1].formatted_address;
          document.getElementById('post_location_name').innerHTML = ' ' +results[1].formatted_address;
        } else {
          window.alert('No results found');
        }
      } else {
        // window.alert('Geocoder failed due to: ' + status);
      }
    });
  }

  // ==================================== reverse geocording END ======================================

  // ==================================== post like_count ======================================


  $scope.toggleLike = function(e) {
    if (user.isAuthenticated === true) {
      
      if (e === true) {
        if (user.likes.indexOf($scope.postId) === -1) {
          $scope.like_count ++;
          $scope.watch = true;
          user.likes.push($scope.postId);
          window.localStorage['user'] = JSON.stringify(user);

          var userId = parseInt(user.userid);
          var postId = parseInt($scope.postId);
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
          if ($rootScope.allData.cards[i].id === $stateParams.postId) {
            $rootScope.allData.cards[i].like_count ++;
            $rootScope.allData.cards[i].watch = true;
            break;
          }
          i ++;
        }

      } else {
        if (user.likes.indexOf($scope.postId) != -1) {
          $scope.like_count --;
          $scope.watch = false;
          var index = user.likes.indexOf($scope.postId);
          user.likes.splice(index, 1);
          window.localStorage['user'] = JSON.stringify(user);

          var userId = parseInt(user.userid);
          var postId = parseInt($scope.postId);
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
          if ($rootScope.allData.cards[i].id === $stateParams.postId) {
            $rootScope.allData.cards[i].like_count --;
            $rootScope.allData.cards[i].watch = false;
            break;
          }
          i ++;
        }
      }


      var like_count = parseInt($scope.like_count);
      var formData = { like_count: like_count };
      var postData = 'likeData='+JSON.stringify(formData);

      var request = $http({
          method: "post",
          url: mServerAPI + "/cardDetail/" + $scope.postId + "/like",
          crossDomain : true,
          data: postData,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          cache: false
      });

      request.success(function() {

      });

    } else {
      $ionicPopup.alert({
        title: 'We Change Makers',
        template: '로그인 후에 이용 가능합니다'
      });
      $scope.watch = false;

      var i = 0;
      while( i < $rootScope.allData.cards.length) {
        if ($rootScope.allData.cards[i].id === $stateParams.postId) {
          $rootScope.allData.cards[i].watch = false;
          break;
        }
        i ++;
      }
      
    }
  }
  // ==================================== post like_count END ======================================

  
  // ==================================== Post comment ======================================
  $scope.addComment =function() {
    
    if (user.isAuthenticated === true) {
      var comment = document.getElementById("comment").value;
      if ( comment === "" ) {
        alert('내용을 입력하세요.');
      } else {
        $scope.username = user.username;
        $scope.userimage = user.userimage;
        $scope.userid = String(user.userid);

        if ($scope.userimage === null) {
          $scope.userimage = "http://mud-kage.kakao.co.kr/14/dn/btqchdUZIl1/FYku2ixAIgvL1O50eDzaCk/o.jpg";
        }
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

    } else {
      $ionicPopup.alert({
        title: 'We Change Makers',
        template: '로그인 후에 이용 가능합니다'
      });
      document.getElementById("comment").value = "";
    }

  }
  // ==================================== Post comment END ======================================

  // =========================== Check current user & comment user =============================
  $scope.userChecked = function(comment) {  
    
    if (user.isAuthenticated === true) {
      if ( parseInt(comment.user[0].user_id) === user.userid ) {
        return { 'display' : 'inline-block' };
      } else {
        return { 'display' : 'none' };
      }
    } else {
      return { 'display' : 'none' };
    }

  }  

  // ========================= Check current user & card user END ===========================

  // ==================================== Delete comment ======================================

  $scope.deleteComment = function(comment) {

    if (confirm('Are you sure you want to delete?')) {
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
    } else {
      
    }
  }

  // ==================================== Delete comment END======================================

  var ChangeMakerPost = function() {
    var confirmPopup = $ionicPopup.confirm({
      title: 'We Change Makers',
      template: 'ChangeMaker가 되어 해당 이슈를 해결하는데 참여하시겠습니까?'
    });
    confirmPopup.then(function(res) {
      if(res) {
        // $scope.weChanges.push(user);

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


  $scope.weChange = function() {

    if (user.isAuthenticated === true) {
      console.log($stateParams.postId);

      if ((user.changes.length === 0) || (user.changes.indexOf($stateParams.postId) === -1)) {
        ChangeMakerPost();
        user.changes.push($stateParams.postId);
        window.localStorage['user'] = JSON.stringify(user);
        $scope.changers[0].push(changerObject);
      
      } else {
        $ionicPopup.alert({
          title: 'We Change Makers',
          template: '이미 참여하셨습니다'
        });
      }

    } else {
      $ionicPopup.alert({
        title: 'We Change Makers',
        template: '로그인 후에 이용 가능합니다'
      });
    }
  }


  $scope.$ionicGoBack = function() {
    // window.location.reload(true);
  }

  /*맵 보여주기*/
  $scope.showMap = function() {
    $state.go('tabs.location_h', { 'latlng': latlng, 'progress' : progress});
  }

});



