wcm.controller("HomeController", function($scope, $rootScope, $cordovaNetwork, $state, $ionicPopup, $cordovaCamera, $http, $timeout, $stateParams, $cordovaFile, $cordovaFileTransfer, $ionicPopover, $cordovaGeolocation, $cordovaOauth,$ionicPlatform, $ionicSlideBoxDelegate) {

  navigator.geolocation.watchPosition(showPosition);

  var user = JSON.parse(window.localStorage['user'] || '{}');
  var cardList = JSON.parse(window.localStorage['cardList'] || '{}');
  $scope.noMoreItemsAvailable = false;

  $scope.$on('$ionicView.beforeEnter', function(){

    // //앱에서 열였다면
    if(ionic.Platform.isWebView()){
      console.log('typeof Preferences != undefined : ' + (typeof Preferences != 'undefined'));
      //com.portnou.cordova.plugin.preferences plugin에서 앱의 prefrences에 저장
      if(typeof Preferences != 'undefined'){
        //다시 보지 않기
        Preferences.get('notShowPref', function(notShowPref) {
          console.log('success notShowPref : ' +  notShowPref);
          if(document.getElementById('welcomeOverlay') != null){
             //다시 보지 않기가 true라면 
             console.log("notShowPref == true : " +  (notShowPref == "true"));
             console.log("notShowPref == false : " +  (notShowPref == "false"));
            if(notShowPref == 'true'){
              console.log('display none');
              document.getElementById('welcomeOverlay').setAttribute('style','display:none');
            }else{
              console.log('display block');
              document.getElementById('welcomeOverlay').setAttribute('style','display:block');
            }
          }
        }, function(error){
          console.log('error: : ' +  error);
        });

        //로그인 한 상태라면 prefresnces에 저장된 user id로 서버에서 유저 정보를 가져와 localStorage에 저장
        Preferences.get('loginId', function(loginId) {
          if(loginId != null){
            console.log('success loginId : ' +  loginId);
            var request = $http({
               method: "get",
               url: mServerAPI + "/user/" + loginId,
               crossDomain : true,
               headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
               cache: false
            });

            request.success(function(data) {
              console.log('Get User data : ' + data);
              var user = {
                username: data.users[0].username,
                userid: data.users[0].user_id,
                userimage: data.users[0].userimage.split("amp;").join("&"),
                isAuthenticated: true,
                likes : [],
                changes : [],
              }; 

              //user watch list저장
              if (data.users[0].likes.length > 0) {
                for(var i = 0; i < data.users[0].likes.length; i++ ) {
                  user.likes.push(data.users[0].likes[i].post_id); 
                }
              }
              console.log('data.users[0].changes.length : ' + data.users[0].changes.length);
              //user changer list저장
              if (data.users[0].changes.length > 0) {
                for(var i = 0; i < data.users[0].changes.length; i++ ) {
                  user.changes.push(data.users[0].changes[i].post_id); 
                }
              }
          
              window.localStorage['user'] = JSON.stringify(user);
            });
          }
        }, function(error){
          console.log('error: : ' +  error);
        });
      }
    }else{
      if(document.getElementById('welcomeOverlay') != null){
        document.getElementById('welcomeOverlay').setAttribute('style','display:none');
      }
    }
  });

  //sort type
  $scope.sortingTypeList = [
    { text: "최신순", value: "registration" },
    { text: "거리순", value: "location" },
    { text: "위험순", value: "warning" }
  ];


  //sort type default value
  $scope.data = {
    sortingType: 'registration'
  };

  //처음 view에서 다시보지 않기의 초기값
  $scope.notShowChecked = { checked: false };

  $scope.downloaded = false;
  $scope.page = 0;
  $rootScope.allData = { 
                          cards: []
                       };

  /*
  * deviceready > app file system안에 폴더만들고 이미지 저장, 인터넷 연결 listener
  */
  $ionicPlatform.ready(function() {
    console.log('$ionicPlatform ready');
    console.log('$ionicPlatform ionic.Platform.isWebView() : ' + ionic.Platform.isWebView());

    //앱에서 켰다면 
    if(ionic.Platform.isWebView()){

      // card이미지를  file system에 저장하는 부분 임시로 주석처리 by tjhan 20151002
      // console.log('cordova.file : ' + cordova.file);
      // console.log('cordova.file.dataDirectory : ' + cordova.file.dataDirectory);

      // //cordova.file.dataDirectory안에 cardImage 디렉토리 (없다면 만들고) 안에 이미지 다운로드 시작
      // $cordovaFile.checkDir(cordova.file.dataDirectory, "cardImage")
      // .then(function (success) {
      //   console.log('checkDir success : ' + success));
      //   $scope.fileDownload();
      //   // success
      // }, function (error) {
      //   // error
      //   console.log('checkDir error : ' + JSON.stringify(error));
      //   $cordovaFile.createDir(cordova.file.dataDirectory, "cardImage", true)
      //   .then(function (success) {
      //     console.log('CREATE success : ' + JSON.stringify(success));
      //     $scope.fileDownload();
      //     // success
      //   }, function (error) {
      //     console.log('CREATE error : ' + JSON.stringify(error));
      //     // error
      //   });
      // });

      /*인터넷 연결 상태 listeners*/
      // listen for Online event
      $rootScope.$on('$cordovaNetwork:online', function(event, networkState){
        var onlineState = networkState;
        $scope.closeSubHeader();
      })
      // listen for Offline event
      $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
        var offlineState = networkState;
        $scope.showSubHeader();
      })
    }
  });
  
  $scope.nextSlide = function() {
    $ionicSlideBoxDelegate.next();
  }

  /*
  *   서버에서 이미지 가져와서 app file system안에 저장
  */
  $scope.fileDownload = function(){
    if(!$scope.downloaded){
      $scope.downloaded = true;
      for (var i = 0; i < cardList.cards.length; i++) {
        // if(i > 3) return;
        var fileName = cardList.cards[i].img_path;
        if(fileName != ''){
          var filePath = mServerUpload + fileName;
          var targetPath = cordova.file.dataDirectory+ 'cardImage/' + fileName;
          var options = {};
          var trustHosts = true;

          console.log('fullpath : ' + filePath);
          console.log('targetPath : ' + targetPath);

          $cordovaFileTransfer.download(filePath, targetPath, options, trustHosts)
          .then(function(result) {
            // Success!
            console.log('download success : ' + JSON.stringify(result));
          }, function(err) {
            // Error
            console.log('download error : ' + JSON.stringify(err));
          }, function (progress) {
            $timeout(function () {
              $scope.downloadProgress = (progress.loaded / progress.total) * 100;
            })
          });
        }
      }
    }
  }

  /*
  * 인터넷 연결 끊김 sub header 닫기
  */
  $scope.closeSubHeader = function(){
   // document.getElementById('sub_header_offline').setAttribute('style','display:none');
  }
  /*
  * 인터넷 연결 끊김 sub header 보이기
  */
  $scope.showSubHeader = function(){
    //document.getElementById('sub_header_offline').setAttribute('style','display:block');
  }

  /*
  * 현재 id보다 큰 card를 가져와서 메인에 추가함
  * 수정/삭제 된 card를 cover할 수 없으므로 현재 사용하지 않고 보류중
  */
  $scope.getNewCards = function() {

    //app에서 띄운 webview가 아니거나 online일 경우만
    if (!(ionic.Platform.isWebView()) || $cordovaNetwork.isOnline()) {

      /* isOnline */  
      $timeout( function() {

        //localStorage cardList 갱신
        cardList = JSON.parse(window.localStorage['cardList'] || '{}');
        console.log('getNewCards - latest id : '  + cardList.cards[0].id);

        //id보다 최신 cards를 불러온다
        var request = $http({
            method: "get",
            url: mServerAPI + "/cardsMore/" + cardList.cards[0].id,
            crossDomain : true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            cache: false
        });

        request.success(function(data) {
          var temp = [];
          temp.push(JSON.parse(localStorage.getItem('cardList')));
          for (var i = 0; i < data.cards.length; i++) {
            temp[0].cards.unshift(data.cards[i]);
            if(data.cards[i].img_path == '') data.cards[i].img_path = mNoImage;
            $rootScope.allData.cards.unshift(data.cards[i]);
          }
          localStorage.setItem('cardList', JSON.stringify(temp[0]));
        });

        //Stop the ion-refresher from spinning
        $scope.$broadcast('scroll.refreshComplete');  
      }, 1000);
  
    } else {

      /* isOffline */
      $ionicPopup.alert({
        title: 'We Change Makers',
        template: 'getNewCards Check your network connection.'
      });

      //미리 가져온 cardlist 사용
      // $scope.offlineCard();

      //Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');
    }
  }

  /*
  * card를 새로 가져옴
  * @param : init(String) 'init'이면 처음 페이지 데이터를 다시 가져옴
  */
  $scope.doRefresh = function(init) {

    console.log('doRefresh');

    $scope.noMoreItemsAvailable = true;

    $timeout( function() { 
      // console.log('doRefresh (!(ionic.Platform.isWebView()) : ' + !ionic.Platform.isWebView());
      // console.log('doRefresh $cordovaNetwork.isOnline() : ' + $cordovaNetwork.isOnline());
      //app에서 띄운 webview가 아니거나 online일 경우만
      if (!(ionic.Platform.isWebView()) || $cordovaNetwork.isOnline()) {
        /* isOnline */  
        // init이면 처음 페이지 데이터를 다시 가져옴
        if(init == 'init'){
          $scope.page = 0;
          $rootScope.allData = { 
                          cards: []
                       };
          var request = $http({
              method: "get",
              url: mServerAPI + "/cards",
              crossDomain : true,
              headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
              cache: false
          });

          request.success(function(data) {
            window.localStorage['cardList'] = JSON.stringify(data);
          });
        }

        if($scope.currentLat == null){
          $scope.currentLat = 37.574515;
          $scope.currentLon = 126.976930;
        }
        var formData = { 
                        lat: $scope.currentLat,
                        lon: $scope.currentLon
                      };


        console.log('lat : ' + $scope.currentLat + ' lon : ' + $scope.currentLon);

        var postData = 'locationData='+JSON.stringify(formData);

        var request = $http({
            method: "post",
            url: mServerAPI + "/card/" + $scope.page + '/' + $scope.data.sortingType,
            crossDomain : true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            data: postData,
            cache: false
        });
        request.error(function(error){
          console.log('error : ' + JSON.stringify(error))
        })
        request.success(function(data) {

          for (var i = 0; i < data.cards.length; i++) {
            
            $scope.noMoreItemsAvailable = false;

            if (data.cards[i].status === "0") {
              data.cards[i].statusDescription = "위험요소가 등록되었습니다.";
            } else if (data.cards[i].status === "33") {
              data.cards[i].statusDescription = "위험요소가 등록되었습니다.";
            } else if (data.cards[i].status === "66") {
              data.cards[i].statusDescription = "위험요소를 해결 중 입니다.";
            } else {
              data.cards[i].statusDescription = "위험요소가 해결 되었습니다.";
            }

            if (data.cards[i].img_path == '') {
              data.cards[i].img_path = mNoImage;
            } else {
              data.cards[i].img_path = mServerUpload + data.cards[i].img_path;
            }

            data.cards[i].address = data.cards[i].location_name;
            //url 중에 "&"은 "amp;"로 db에 저장되어 있으므로 변환한다
            if(data.cards[i].user[0].userimage != null){
              data.cards[i].user[0].userimage = data.cards[i].user[0].userimage.split("amp;").join("&");
            }
            var object =  data.cards[i];
            $rootScope.allData.cards.push(object);
            if(user != null){
              if (user.isAuthenticated === true) {
                for(var j = 0; j < $rootScope.allData.cards.length; j ++) {
                  
                  if(user.likes.indexOf($rootScope.allData.cards[j].id) != -1) {
                    $rootScope.allData.cards[j].watch = true;
                  } else {
                    $rootScope.allData.cards[j].watch = false;
                  }
                }
              }
            }
          }

          $scope.page++;
          $scope.$broadcast('scroll.infiniteScrollComplete');  

        });

        //Stop the ion-refresher from spinning
        $scope.$broadcast('scroll.refreshComplete');  
      } else {

        /* isOffline */
        $ionicPopup.alert({
          title: 'We Change Makers',
          template: 'doRefresh Check your network connection.'
        });

        //미리 가져온 cardlist 사용
        // $scope.offlineCard();
        
        //Stop the ion-refresher from spinning
        $scope.$broadcast('scroll.refreshComplete');
      }
    },10);
  }

  /*
  * offline일 경우 처음에 가져온 cardlist를 사용하여 보여준다
  */
  $scope.offlineCard = function(){

    //data 비우고 push 
    $rootScope.allData = { 
                    cards: []
                 };
    //cardList 갱신
    cardList = JSON.parse(window.localStorage['cardList'] || '{}');
    //offline일 경우 미리 가져왔던 cardlist데이터와 file system에 저장되 있는 이미지를 보여줌
    for (var i = 0; i < cardList.cards.length; i++) {
      var fileName = cardList.cards[i].img_path.split("/").pop();
      if(fileName != ''){
        console.log('offline FileName : ' + fileName);
        console.log('offline fullpath : ' + cordova.file.dataDirectory+ 'cardImage/' + fileName);
        cardList.cards[i].img_path = cordova.file.dataDirectory+ 'cardImage/' + fileName;
      }else{
        cardList.cards[i].img_path = mNoImage;
      }
      $rootScope.allData.cards.push(cardList.cards[i]);
    }
  }

  /*
  * sort버튼을 눌렀을 때 popover show
  * $event 클릭된 event
  */
  $scope.openPopover = function ($event) {
   $ionicPopover.fromTemplateUrl('templates/popover.html', {
     scope: $scope
   }).then(function(popover) {
     $scope.popover = popover;
     $scope.popover.show($event);
   });
  };


  function showPosition(position) { 
    $scope.currentLat = position.coords.latitude;
    $scope.currentLon = position.coords.longitude;
  }

  $scope.sortBy = function(sortType) {
    $scope.popover.hide();
    $scope.page = 0;

      var formData = { 
                        lat: $scope.currentLat,
                        lon: $scope.currentLon
                      };

      var postData = 'locationData='+JSON.stringify(formData);

      var request = $http({
          method: "post",
          url: mServerAPI + "/card/" + $scope.page + '/' + sortType,
          crossDomain : true,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          data: postData,
          cache: false
      });  


    request.success(function(data) { 

      $rootScope.allData.cards = [];

      for (var i = 0; i < data.cards.length; i++) {
        
        if (data.cards[i].status === "0") {
          data.cards[i].statusDescription = "위험요소가 등록되었습니다.";
        } else if (data.cards[i].status === "33") {
          data.cards[i].statusDescription = "위험요소가 등록되었습니다.";
        } else if (data.cards[i].status === "66") {
          data.cards[i].statusDescription = "위험요소를 해결 중 입니다.";
        } else {
          data.cards[i].statusDescription = "위험요소가 해결 되었습니다.";
        }

        if (data.cards[i].img_path == '') {
          data.cards[i].img_path = mNoImage;
        } else {
          data.cards[i].img_path = mServerUpload + data.cards[i].img_path;
        }

        //url 중에 "&"은 "amp;"로 db에 저장되어 있으므로 변환한다
        if(data.cards[i].user[0].userimage != null){
          data.cards[i].user[0].userimage = data.cards[i].user[0].userimage.split("amp;").join("&");
        }
        data.cards[i].address = data.cards[i].location_name;

        var object =  data.cards[i];
        $rootScope.allData.cards.push(object);

        if(user != null){
          if (user.isAuthenticated === true) {
            for(var j = 0; j < $rootScope.allData.cards.length; j ++) {
              
              if(user.likes.indexOf($rootScope.allData.cards[j].id) != -1) {
                $rootScope.allData.cards[j].watch = true;
              } else {
                $rootScope.allData.cards[j].watch = false;
              }
            }
          }
        }
      
      }
      console.log("success");
      $scope.page++;

      $scope.$broadcast('scroll.infiniteScrollComplete');  
    });

  }

  // popover창에서 sort type을 변경 했을 때 호출됨
  $scope.sortingTypeChange = function(item) {
    if (item.value == 'registration') {
      $scope.sortBy(item.value);
    } else if (item.value == 'warning') {
      $scope.sortBy(item.value);
    } else if (item.value == 'location') {
      $scope.sortBy(item.value);
    }
  };

  // warnings map show
  $scope.findWarning = function() {
    $state.go("tabs.map");
  }

  // 각 card의 location map show
  $scope.showMap = function(lat, lon) {
    var latlng = new google.maps.LatLng(lat, lon);
    $state.go('tabs.location_h', { 'latlng': latlng});
  }

  // Check current user & card user
  $scope.userChecked = function(card) {

    if(user != null){
      if (user.isAuthenticated === true) {
        if ( card.user[0].user_id === user.userid ) {
          return { 'display' : 'inline-block' };
        } else {
          return { 'display' : 'none' };
        }
      } else {
        return { 'display' : 'none' }
      }
    }
  }

  // Delete Card
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
  
  // Edit Card  
  $scope.editCard = function(id) {
    $state.go('tabs.edit', { 'id': id});
  };


  // Toggle Like-Count
  $scope.toggleLike = function(e, id) {

    if(user != null){
      if (user.isAuthenticated === true) {

        if (e === true) {

          if (user.likes.indexOf(id) === -1) {
            user.likes.push(id);
            window.localStorage['user'] = JSON.stringify(user);
            console.log(user.likes);
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
              $scope.selectedCard = $rootScope.allData.cards[i];
              break;
            }
            i ++;
          }


        } else {
          
          if (user.likes.indexOf(id) != -1) {
            var index = user.likes.indexOf(id);
            user.likes.splice(index, 1);
            window.localStorage['user'] = JSON.stringify(user);
            console.log(user.likes);
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
              $scope.selectedCard = $rootScope.allData.cards[i];
              break;
            }
            i ++;
          }
        }

        var like_count = parseInt($scope.selectedCard.like_count);
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


      } else {
        $ionicPopup.alert({
          title: 'We Change Makers',
          template: '로그인 후에 이용 가능합니다'
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
  }

  $scope.overlayClose = function() {
    document.getElementById('welcomeOverlay').setAttribute('style','display:none');
  }

});
