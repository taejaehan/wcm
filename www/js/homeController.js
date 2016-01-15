wcm.controller("HomeController", function($scope, $rootScope, $cordovaNetwork, $state, $ionicPopup, $cordovaCamera, $http, $timeout, $cordovaFile, $cordovaFileTransfer, $ionicPopover, $cordovaGeolocation, $cordovaOauth, $ionicSlideBoxDelegate, $cordovaPreferences, $ionicLoading, $ionicHistory, CardService, CardsFactory, CardBlockFactory, $ionicScrollDelegate) {

  navigator.geolocation.watchPosition(showPosition, showPositionError);
  var user = JSON.parse(window.localStorage['user'] || '{}');
  var cardList = JSON.parse(window.localStorage['cardList'] || '{}');
  $scope.welcome = true;
  $scope.noMoreItemsAvailable = false;
  $scope.logoTitle='<img class="title-image" src="img/logo.png" />';
  //sort type
  $scope.sortingTypeList = [
    { text: "최신순", value: "registration" },
    { text: "거리순", value: "location" },
    { text: "위험순", value: "warning" }
  ];
  //sort type default value
  $scope.data = {
    // sortingType: 'registration'
    sortingType: CardService.sortType
  };

  console.log($scope.data.sortingType);
  //처음 view에서 다시보지 않기의 초기값
  $scope.notShowChecked = { checked: false };
  $scope.downloaded = false;
  // $scope.page = 0;
  // $rootScope.allData = { cards: [] };
  $rootScope.shareCard = '';


  // Get plugin
  var bgLocationServices =  window.plugins.backgroundLocationServices;

  //Congfigure Plugin
  bgLocationServices.configure({
       //Both
       desiredAccuracy: 20, // Desired Accuracy of the location updates (lower means more accurate but more battery consumption)
       distanceFilter: 5, // (Meters) How far you must move from the last point to trigger a location update
       debug: true, // <-- Enable to show visual indications when you receive a background location update
       interval: 9000, // (Milliseconds) Requested Interval in between location updates.
       //Android Only
       notificationTitle: 'BG Plugin', // customize the title of the notification
       notificationText: 'Tracking', //customize the text of the notification
       fastestInterval: 5000, // <-- (Milliseconds) Fastest interval your app / server can handle updates
       useActivityDetection: true // Uses Activitiy detection to shut off gps when you are still (Greatly enhances Battery Life)

  });

  //Register a callback for location updates, this is where location objects will be sent in the background
  bgLocationServices.registerForLocationUpdates(function(location) {
       console.log("We got an BG Update" + JSON.stringify(location));
  }, function(err) {
       console.log("Error: Didnt get an update", err);
  });

  //Register for Activity Updates (ANDROID ONLY)
  //Uses the Detected Activies API to send back an array of activities and their confidence levels
  //See here for more information: //https://developers.google.com/android/reference/com/google/android/gms/location/DetectedActivity
  bgLocationServices.registerForActivityUpdates(function(acitivites) {
       console.log("We got an BG Update" + activities);
  }, function(err) {
       console.log("Error: Something went wrong", err);
  });

  //Start the Background Tracker. When you enter the background tracking will start, and stop when you enter the foreground.
  bgLocationServices.start();


  ///later, to stop
  // bgLocationServices.stop();


  $scope.$on('$ionicView.beforeEnter', function(){

    // 앱에서 열였다면
    if(mIsWebView){
        var tryNum = 0;
        //com.portnou.cordova.plugin.preferences plugin에서 앱의 prefrences에 저장
        var tryNotShowOvelray = function(){
          console.log('typeof Preferences != undefined : ' + (typeof Preferences != 'undefined'));
          if(typeof Preferences != 'undefined'){
            console.log('Preferences OK');
            //다시 보지 않기
            Preferences.get('notShowPref', function(notShowPref) {
               //다시 보지 않기가 true라면
              if(notShowPref == 'true'){
                $scope.welcome = false;
              }else{
                $scope.welcome = true;
              }
            }, function(error){
              console.log('error: : ' +  error);
            });
          }else{
            console.log('Preferences NO : ' + tryNum);
            //Preferences를 찾아서 3번 시도한다
            if(tryNum < 4 ){
              $timeout( function() {
                tryNotShowOvelray();
                tryNum++;
              }, 1000);
            }
          }
        }
        tryNotShowOvelray();

    } else {    //web에서는 overlay를 보여주지 않는다
      $scope.welcome = false;
    }

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

    /*cardList를 모두 가져와 localStorage['cardList'] 저장(WarningMap에 사용)*/
    $ionicLoading.show({
      template: '<ion-spinner icon="bubbles"></ion-spinner><br/>로딩중..'
    });
    if(user.isAuthenticated) {
      CardsFactory.getCards(user.userid);
    } else {
      CardsFactory.getCards();
    };

    //forwardView가 없거나 전에 탭이 ion2(home tab)이 아니라면
    if($ionicHistory.forwardView() == null || $ionicHistory.forwardView().historyId !== 'ion2') {
      //forwardView가 없고 전에 탭이 ion2(home tab)이 아니라면 (카드 등록시 $ionicHistory.clearHistory()하면 실행 됨)
      if($ionicHistory.forwardView() != null && $ionicHistory.forwardView().historyId !== 'ion2'){
        if($scope.data.sortingType != 'registration'){
          $scope.sortBy($scope.data.sortingType);
        }
      }else{
        $scope.data.sortingType = 'registration';
        $scope.doRefresh();
      }
    }else{
      //forwardview가 없거나 다른 탭에서 왔다면 스크롤 
      if(CardService.scrollPosition != null){
        $timeout(function() {
          $ionicScrollDelegate.scrollTo(0,CardService.scrollPosition.top,false);
          $scope.page = CardService.page;
        }, 200);
      }
    }
    // card이미지를  file system에 저장하는 부분 넣으면 너무 느려서 임시로 주석처리 by tjhan 20151002
    /*app file system안에 폴더만들고 이미지 저장*/
    /*console.log('cordova.file : ' + cordova.file);
    console.log('cordova.file.dataDirectory : ' + cordova.file.dataDirectory);
    //cordova.file.dataDirectory안에 cardImage 디렉토리 (없다면 만들고) 안에 이미지 다운로드 시작
    $cordovaFile.checkDir(cordova.file.dataDirectory, "cardImage")
    .then(function (success) {
      console.log('checkDir success : ' + success));
      $scope.fileDownload();
      // success
    }, function (error) {
      // error
      console.log('checkDir error : ' + JSON.stringify(error));
      $cordovaFile.createDir(cordova.file.dataDirectory, "cardImage", true)
      .then(function (success) {
        console.log('CREATE success : ' + JSON.stringify(success));
        $scope.fileDownload();
        // success
      }, function (error) {
        console.log('CREATE error : ' + JSON.stringify(error));
        // error
      });
    });*/
  });
  /*
  * welcome slider previous
  */
  $scope.sliderPrev = function() {
    $ionicSlideBoxDelegate.previous();
  }
  /*
  * welcome slider next
  */
  $scope.sliderNext = function() {
    $ionicSlideBoxDelegate.next();
  }
  /*
  * 인터넷 연결 끊김 sub header 닫기
  */
  $scope.closeSubHeader = function(){
   document.getElementById('sub_header_offline').setAttribute('style','display:none');
  }
  /*
  * 인터넷 연결 끊김 sub header 보이기
  */
  $scope.showSubHeader = function(){
    document.getElementById('sub_header_offline').setAttribute('style','display:block');
  }
  /*
  * 사용자가 로그인했는지 안했는지에 따라 버튼을 show를 설정
  */
  $scope.userLogin = function(card) {
    if(user != null){
      if (user.isAuthenticated === true) {
        if ( card.user[0].user_id == user.userid ) {
          return false;
        } else {
          return true;
        }
      } else {
        return false;
      }
    }
  }
  /*
  * Check current user & card user
  */
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
  /*
  * card를 새로 가져옴
  */
  $scope.doRefresh = function() {

    console.log('doRefresh');
    //noMoreItemsAvailable를 true로 하여 처음에 loadMore가 실행되지 않게 함
    $scope.noMoreItemsAvailable = true;

    
    //app에서 띄운 webview가 아니거나 online일 경우만
    if (!(mIsWebView) || $cordovaNetwork.isOnline()) {
      $ionicLoading.show({
        template: '<ion-spinner icon="bubbles"></ion-spinner><br/>로딩중..'
      });

      $scope.page = 0;
      $rootScope.allData = { cards: [] };
      if($scope.currentLat == null){
        $scope.currentLat = 37.574515;
        $scope.currentLon = 126.976930;
      };
      var formData = {
                      lat: $scope.currentLat,
                      lon: $scope.currentLon
                    };
      var postData = 'locationData='+JSON.stringify(formData);

      var url = mServerAPI + "/card/" + $scope.page + '/' + $scope.data.sortingType;
      if(user.isAuthenticated === true){
        url = url + '/' + user.userid;
      }
      console.log('url : ' + url);
      var request = $http({
          method: "post",
          url: url,
          crossDomain : true,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          data: postData,
          cache: false
      });

      request.error(function(error){
        $ionicLoading.hide();
        console.log('error : ' + JSON.stringify(error));
      })
      request.success(function(data) {
        //timeout으로 처음 view가 load되는 시간동안 card를 넣어주지 않음 by tjhan 160112
        $timeout( function() {
          $ionicLoading.hide();
          for (var i = 0; i < data.cards.length; i++) {

            CardService.status(data.cards, i);

            if (data.cards[i].img_path == '') {
              data.cards[i].img_path = mNoImageThumb;
            } else if(data.cards[i].img_path.substr(0,4) == 'http'){
              data.cards[i].img_path = data.cards[i].img_path;
            }else{
              data.cards[i].img_path = mServerUploadThumb + data.cards[i].img_path;
            }

            if(data.cards[i].user[0].userimage != null){
              data.cards[i].user[0].userimage = data.cards[i].user[0].userimage;
            }

            data.cards[i].address = data.cards[i].location_name;
            data.cards[i].userId = data.cards[i].user[0].user_id;

            var object =  data.cards[i];
            $rootScope.allData.cards.push(object);

            if(user != null){
              if (user.isAuthenticated === true) {
                for(var j = 0; j < $rootScope.allData.cards.length; j ++) {
                  if(user.watchs.indexOf($rootScope.allData.cards[j].id) != -1) {
                    $rootScope.allData.cards[j].watch = true;
                  } else {
                    $rootScope.allData.cards[j].watch = false;
                  }
                }
              }
            }
          };
        }, 500);
        
        $scope.$broadcast('scroll.refreshComplete');
        $timeout( function() {
          //dorefresh가 끝나고 2초 뒤에 noMoreItemsAvailable를 false로 하여 loadMore를 가능하게 함
          $scope.page = 1;
          $scope.noMoreItemsAvailable = false;
        }, 2000);
      });
    } else {
      /* isOffline */
      $ionicPopup.alert({
        title: mAppName,
        template: '인터넷에 연결 상태를 확인하세요',
        cssClass: 'wcm-error',
      });
    }
  };

  /*
  * card를 더 가져옴
  */
  $scope.loadMore = function(){
    console.log('loadMore');
    //app에서 띄운 webview가 아니거나 online일 경우만
    if (!(mIsWebView) || $cordovaNetwork.isOnline()) {
      $ionicLoading.show({
        template: '<ion-spinner icon="bubbles"></ion-spinner><br/>로딩중..'
      });

      if($scope.currentLat == null){
        $scope.currentLat = 37.574515;
        $scope.currentLon = 126.976930;
      };
      var formData = {
                      lat: $scope.currentLat,
                      lon: $scope.currentLon
                    };
      var postData = 'locationData='+JSON.stringify(formData);

      var url = mServerAPI + "/card/" + $scope.page + '/' + $scope.data.sortingType;
      if(user.isAuthenticated === true){
        url = url + '/' + user.userid;
      };
      console.log('url : ' + url);
      var request = $http({
          method: "post",
          url: url,
          crossDomain : true,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          data: postData,
          cache: false
      });

      request.error(function(error){
        $ionicLoading.hide();
        console.log('error : ' + JSON.stringify(error));
      })
      request.success(function(data) {
        $ionicLoading.hide();
        if(data.cards.length > 0){
          $scope.noMoreItemsAvailable = false;
          console.log('scope.noMoreItemsAvailable :' + $scope.noMoreItemsAvailable);
        }else{
          $scope.noMoreItemsAvailable = true;
        };
        for (var i = 0; i < data.cards.length; i++) {

          CardService.status(data.cards, i);
          if (data.cards[i].img_path == '') {
            data.cards[i].img_path = mNoImageThumb;
          } else if(data.cards[i].img_path.substr(0,4) == 'http'){
            data.cards[i].img_path = data.cards[i].img_path;
          }else{
            data.cards[i].img_path = mServerUploadThumb + data.cards[i].img_path;
          }

          if(data.cards[i].user[0].userimage != null){
            data.cards[i].user[0].userimage = data.cards[i].user[0].userimage;
          }

          data.cards[i].address = data.cards[i].location_name;
          data.cards[i].userId = data.cards[i].user[0].user_id;

          var object =  data.cards[i];
          $rootScope.allData.cards.push(object);

          if(user != null){
            if (user.isAuthenticated === true) {
              for(var j = 0; j < $rootScope.allData.cards.length; j ++) {
                if(user.watchs.indexOf($rootScope.allData.cards[j].id) != -1) {
                  $rootScope.allData.cards[j].watch = true;
                } else {
                  $rootScope.allData.cards[j].watch = false;
                }
              }
            }
          }
        };
        $scope.page++;
        $scope.$broadcast('scroll.infiniteScrollComplete');
      });
    } else {
      /* isOffline */
      $ionicPopup.alert({
        title: mAppName,
        template: '인터넷에 연결 상태를 확인하세요',
        cssClass: 'wcm-error',
      });
    }
  };
  $scope.openPopover = function ($event) {
    // console.log('openPopover');
    $ionicPopover.fromTemplateUrl('templates/popover.html', {
      scope: $scope
    }).then(function(popover) {
      $scope.popover = popover;
      $scope.popover.show($event);
    });
  };
  $scope.postReport = function ($event, card) {
    CardService.temporaryPost = card;
    $ionicPopover.fromTemplateUrl('templates/report.html', {
      scope: $scope
    }).then(function(reportPopover) {
      $scope.reportPopover = reportPopover;
      $scope.reportPopover.show($event);
    });
  };
  /*
  *  계속 현재 위치를 가져와서 위도/경도를 넣어줌
  */
  function showPosition(position) {
    console.log('showPosition position.coords.latitude : '+position.coords.latitude);
    $scope.currentLat = position.coords.latitude;
    $scope.currentLon = position.coords.longitude;
  };
  function showPositionError(error) {
    console.log('showPositionError : (' + error.code + '): ' + error.message);
  };

  /*
  * 분류 타입(최신,위험,위치)에 따라 데이터를 불러옴
  */
  $scope.sortBy = function(sortType) {
    console.log("sortBy sortType : " + sortType);
    $scope.noMoreItemsAvailable = true;
    if($scope.popover != null){
      $scope.popover.hide();
    }
    $scope.page = 0;
    if($scope.currentLat == null){
      $scope.currentLat = 37.574515;
      $scope.currentLon = 126.976930;
    };
    var formData = {
                      lat: $scope.currentLat,
                      lon: $scope.currentLon
                    };

    var postData = 'locationData='+JSON.stringify(formData);

    var url = mServerAPI + "/card/" + $scope.page + '/' + sortType
    if(user.isAuthenticated === true){
      url = url + '/' + user.userid;
    }
    var request = $http({
        method: "post",
        url: url,
        crossDomain : true,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
        data: postData,
        cache: false
    });

    $ionicLoading.show({
      template: '<ion-spinner icon="bubbles"></ion-spinner><br/>로딩중..'
    });

    $rootScope.allData = { cards: [] };

    request.error(function(error){
      $ionicLoading.hide();
      console.log('sort error : ' + JSON.stringify(error))
    });
    request.success(function(data) {
      $ionicLoading.hide();
      for (var i = 0; i < data.cards.length; i++) {

        if (data.cards[i].status === PROGRESS_REGISTER || data.cards[i].status === PROGRESS_START) {
          data.cards[i].statusDescription = PROGRESS_START_TEXT;
        } else if (data.cards[i].status === PROGRESS_ONGOING) {
          data.cards[i].statusDescription = PROGRESS_ONGOING_TEXT;
        } else {
          data.cards[i].statusDescription = PROGRESS_COMPLETED_TEXT;
        }

        if (data.cards[i].img_path == '') {
          data.cards[i].img_path = mNoImageThumb;
        }else if(data.cards[i].img_path.substr(0,4) == 'http'){
          data.cards[i].img_path = data.cards[i].img_path;
        }else{
          data.cards[i].img_path = mServerUploadThumb + data.cards[i].img_path;
        }

        if(data.cards[i].user[0].userimage != null){
          data.cards[i].user[0].userimage = data.cards[i].user[0].userimage;
        }

        data.cards[i].address = data.cards[i].location_name;
        data.cards[i].userId = data.cards[i].user[0].user_id;

        var object =  data.cards[i];
        $rootScope.allData.cards.push(object);

        if(user != null){
          if (user.isAuthenticated === true) {
            for(var j = 0; j < $rootScope.allData.cards.length; j ++) {
              if(user.watchs.indexOf($rootScope.allData.cards[j].id) != -1) {
                $rootScope.allData.cards[j].watch = true;
              } else {
                $rootScope.allData.cards[j].watch = false;
              }
            }
          }
        }
      }
      $scope.$broadcast('scroll.infiniteScrollComplete');
      $timeout( function() {
          //sortBy가 끝나고 2초 뒤에 noMoreItemsAvailable를 false로 하여 loadMore를 가능하게 함
          $scope.page = 1;
          $scope.noMoreItemsAvailable = false;
        }, 2000);
    });

  }

  // popover창에서 sort type을 변경 했을 때 호출됨
  $scope.sortingTypeChange = function(item) {
    CardService.sortType = item.value;
    $scope.sortBy(item.value);
  };
  // warnings map show
  $scope.findWarning = function() {
    // CardService.scrollPosition = $ionicScrollDelegate.getScrollPosition();
    // CardService.page = $scope.page;
    // $state.go("tabs.map");
    /** PUSH 메세지를 발송 **/
    // Encode your key
    var auth = btoa(mPrivateKey + ':');
    var tokens = ['65e2a1edbd4017063adfc1169307f1e4e8d84aa84eb366b02e732b2daf57588c',
    'dbWek7yZiRY:APA91bE4iqe4OCaeQYb50yD0wRIMjOSn9nQ8grjMyIhTdUSrE241JufagHrVmlgL_T0jmhOew-YrRpCFlwnnt_6RLT8BYRJddGp-Y1Xhk2WUwE3jhb9r9AQbwHN6NV8567Rj5SKsTB4j'];
    var message = "hey baby whats up";
    // Build the request object
    var req = {
      method: 'POST',
      url: 'https://push.ionic.io/api/v1/push',
      headers: {
        'Content-Type': 'application/json',
        'X-Ionic-Application-Id': mAppId,
        'Authorization': 'basic ' + auth
      },
      data: {
        "tokens": tokens,
        "notification": {
          "alert": message
        },
        // "scheduled" : 1447834020,
        "production": true
      }
    };
    $ionicLoading.show({
      template: '<ion-spinner icon="bubbles"></ion-spinner>'
    });
    // Make the API call
    $http(req).success(function(resp){
      $ionicLoading.hide();
      // Handle success
      console.log("Ionic Push: Push success!");
      console.log('resp : ' + JSON.stringify(resp));
    }).error(function(error){
      $ionicLoading.hide();
      // Handle error
      console.log("Ionic Push: Push error...");
      console.log('error : ' + JSON.stringify(error));
    });
  }
  // 각 card의 location map show
  $scope.showMap = function(lat, lon) {
    CardService.scrollPosition = $ionicScrollDelegate.getScrollPosition();
    CardService.page = $scope.page;
    var latlng = new google.maps.LatLng(lat, lon);
    $state.go('tabs.location_h', { 'latlng': latlng});
  }
  /*
  * 해당 유저의 fb profile로 연결합니다
  * @param : user_id
  */
  $scope.showUser = function(user_id){
    window.open(
      'https://www.facebook.com/app_scoped_user_id/' + user_id,
      '_blank' // <- This is what makes it open in a new window.
    );
  };
  // Delete Card
  $scope.deleteCard = function(id) {
    var confirmPopup = $ionicPopup.confirm({
      title: mAppName,
      template: '정말로 지우시겠습니까?',
      cssClass: 'wcm-negative',
    });

    confirmPopup.then(function(res) {
      if(res) {
        $ionicLoading.show({
          template: '<ion-spinner icon="bubbles"></ion-spinner>'
        });

        var request = $http({
            method: "get",
            url: mServerAPI + "/cardDetail/" + id + "/delete",
            crossDomain : true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
        });
        request.error(function(error){
          $ionicLoading.hide();
          console.log('error : ' + JSON.stringify(error))
        });
        request.success(function() {
          $ionicLoading.hide();
          $scope.doRefresh();
        });
      }
    });
  }

  // Edit Card
  $scope.editCard = function(id) {
    $state.go('tabs.edit', { 'id': id});
  };


  // Toggle watch-Count
  $scope.toggleWatchHome = function(e, id) {
    CardService.toggleWatch(e,id,user);
  }
  $scope.overlayClose = function() {
    $scope.welcome = false;
    if(mIsWebView){
      console.log('overlayClose Preferences != undefined : ' + (typeof Preferences != 'undefined'));
      //닫고나면 무조건 다시보지 않기
      Preferences.put('notShowPref', true);
    }
  }

  //sns공유 선택 창을 띄움
  $scope.showDialog = function ($event, card) {
    // CardService.share('facebook', card);
    // CardService.share('kakao', card);
    $rootScope.shareCard = card;
    $ionicPopover.fromTemplateUrl('templates/share.html', {
      scope: $scope,
    }).then(function(popover) {
      $scope.popover = popover;
      $scope.popover.show($event);
    });
  }
  //sns type에 따라 share fucntion호출
  $scope.shareCard = function (type) {
    console.log('shareCard : '  + $rootScope.shareCard);
    CardService.share(type, $rootScope.shareCard);
    $scope.popover.hide();
  }

  $scope.getPosition = function(cardId) {
    CardService.scrollPosition = $ionicScrollDelegate.getScrollPosition();
    CardService.page = $scope.page;
    var params = { postId: cardId }
    $state.go("tabs.post_h", params);
  }

  $scope.hidePost = function() {
    // 서버 db에 block 정보 저장
    CardBlockFactory.postHide(user.userid, CardService.temporaryPost.id);

    // local data에 block 정보 저장
    var hidePost = $rootScope.allData.cards.indexOf(CardService.temporaryPost);
    $rootScope.allData.cards.splice(hidePost, 1);
    $scope.reportPopover.hide();
  }

  $scope.blockUser = function() {
    CardBlockFactory.userBlock(user.userid, CardService.temporaryPost.user_id);

    // var hidePosts = [];
    // for(var i=0 ; i < $rootScope.allData.cards.length; i++){
    //   if($rootScope.allData.cards[i].user[0].id == CardService.temporaryPost.user_id){
    //     var hidePost = $rootScope.allData.cards.indexOf($rootScope.allData.cards[i]);
    //     hidePosts.push(hidePost);
    //   };
    // };
    // hidePosts.reverse();
    // for(var i=0 ; i < hidePosts.length; i++){
    //   $rootScope.allData.cards.splice(hidePosts[i], 1);
    // };
    $scope.reportPopover.hide();
    $scope.doRefresh();
  }

  $scope.blockPost = function() {
    CardBlockFactory.postBlock(user.userid, CardService.temporaryPost.id, CardService.temporaryPost.user_id);
    var hidePost = $rootScope.allData.cards.indexOf(CardService.temporaryPost);
    $rootScope.allData.cards.splice(hidePost, 1);
    $scope.reportPopover.hide();
  }

  /******************************************사용하지 않고 보류중*************************************************/
  /*
  *   서버에서 이미지 가져와서 app file system안에 저장
  */
  // $scope.fileDownload = function(){
  //   if(!$scope.downloaded){
  //     $scope.downloaded = true;
  //     for (var i = 0; i < cardList.cards.length; i++) {
  //       // if(i > 3) return;
  //       var fileName = cardList.cards[i].img_path;
  //       if(fileName != ''){
  //         var filePath = mServerUploadThumb + fileName;
  //         var targetPath = cordova.file.dataDirectory+ 'cardImage/' + fileName;
  //         var options = {};
  //         var trustHosts = true;

  //         $cordovaFileTransfer.download(filePath, targetPath, options, trustHosts)
  //         .then(function(result) {
  //           // Success!
  //           console.log('download success : ' + JSON.stringify(result));
  //         }, function(err) {
  //           // Error
  //           console.log('download error : ' + JSON.stringify(err));
  //         }, function (progress) {
  //           $timeout(function () {
  //             $scope.downloadProgress = (progress.loaded / progress.total) * 100;
  //           })
  //         });
  //       }
  //     }
  //   }
  // }
  /*
  * 현재 id보다 큰 card를 가져와서 메인에 추가함
  * 수정/삭제 된 card를 cover할 수 없으므로 현재 사용하지 않고 보류중
  */
  // $scope.getNewCards = function() {
  //   //app에서 띄운 webview가 아니거나 online일 경우만
  //   if (!(mIsWebView) || $cordovaNetwork.isOnline()) {

  //     /* isOnline */
  //     $timeout( function() {
  //       //localStorage cardList 갱신
  //       cardList = JSON.parse(window.localStorage['cardList'] || '{}');
  //       console.log('getNewCards - latest id : '  + cardList.cards[0].id);
  //       //id보다 최신 cards를 불러온다
  //       var request = $http({
  //           method: "get",
  //           url: mServerAPI + "/cardsMore/" + cardList.cards[0].id,
  //           crossDomain : true,
  //           headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
  //           cache: false
  //       });
  //       request.success(function(data) {
  //         var temp = [];
  //         temp.push(JSON.parse(localStorage.getItem('cardList')));
  //         for (var i = 0; i < data.cards.length; i++) {
  //           temp[0].cards.unshift(data.cards[i]);
  //           if(data.cards[i].img_path == '') data.cards[i].img_path = mNoImageThumb;
  //           $rootScope.allData.cards.unshift(data.cards[i]);
  //         }
  //         localStorage.setItem('cardList', JSON.stringify(temp[0]));
  //       });
  //       //Stop the ion-refresher from spinning
  //       $scope.$broadcast('scroll.refreshComplete');
  //     }, 1000);
  //   } else {
  //     /* isOffline */
  //     $ionicPopup.alert({
  //       title: mAppName,
  //       template: '인터넷에 연결 상태를 확인하세요',
  //       cssClass: 'wcm-error',
  //     });
  //     //미리 가져온 cardlist 사용
  //     // $scope.offlineCard();

  //     //Stop the ion-refresher from spinning
  //     $scope.$broadcast('scroll.refreshComplete');
  //   }
  // }
  /*
  * offline일 경우 처음에 가져온 cardlist를 사용하여 보여준다
  */
  // $scope.offlineCard = function(){
  //   //data 비우고 push
  //   $rootScope.allData = {
  //                   cards: []
  //                };
  //   //cardList 갱신
  //   cardList = JSON.parse(window.localStorage['cardList'] || '{}');
  //   //offline일 경우 미리 가져왔던 cardlist데이터와 file system에 저장되 있는 이미지를 보여줌
  //   for (var i = 0; i < cardList.cards.length; i++) {
  //     var fileName = cardList.cards[i].img_path.split("/").pop();
  //     if(fileName != ''){
  //       console.log('offline FileName : ' + fileName);
  //       console.log('offline fullpath : ' + cordova.file.dataDirectory+ 'cardImage/' + fileName);
  //       cardList.cards[i].img_path = cordova.file.dataDirectory+ 'cardImage/' + fileName;
  //     }else{
  //       cardList.cards[i].img_path = mNoImageThumb;
  //     }
  //     $rootScope.allData.cards.push(cardList.cards[i]);
  //   }
  // }
  /******************************************사용하지 않고 보류중*************************************************/
});
