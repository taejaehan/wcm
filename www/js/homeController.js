wcm.controller("HomeController", function($scope, $rootScope, $cordovaNetwork, $state, $ionicPopup, $cordovaCamera, $http, $timeout, $cordovaFile, $cordovaFileTransfer, $ionicPopover, $cordovaGeolocation, $cordovaOauth, $ionicSlideBoxDelegate, $cordovaPreferences, $ionicLoading, $ionicHistory, CardService) {

  navigator.geolocation.watchPosition(showPosition);

  var user = JSON.parse(window.localStorage['user'] || '{}');
  var cardList = JSON.parse(window.localStorage['cardList'] || '{}');

  $scope.noMoreItemsAvailable = false;
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

  $scope.$on('$ionicView.unloaded', function(){
    $rootScope.isHomeView =false;
  });

  $scope.$on('$ionicView.beforeEnter', function(){

    $rootScope.isHomeView =true;

    console.log('$ionicHistory forwardView : ' + $ionicHistory.forwardView());
    console.log('$ionicHistory currentHistoryId : ' + $ionicHistory.currentHistoryId());
    console.log('$ionicHistory backView() : ' + $ionicHistory.backView());
    
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
              if(document.getElementById('welcomeOverlay') != null){
                 //다시 보지 않기가 true라면 
                if(notShowPref == 'true'){
                  document.getElementById('welcomeOverlay').setAttribute('style','display:none');
                }else{
                  document.getElementById('welcomeOverlay').setAttribute('style','display:block');
                }
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
      if(document.getElementById('welcomeOverlay') != null){
        document.getElementById('welcomeOverlay').setAttribute('style','display:none');
      }
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
    var request = $http({
        method: "get",
        url: mServerAPI + "/cards",
        crossDomain : true,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
        cache: false
    });

    request.success(function(data) {
      $ionicLoading.hide();
      window.localStorage['cardList'] = JSON.stringify(data);
    });
    request.error(function(error){
      $ionicLoading.hide();
      console.log('error : ' + JSON.stringify(error))
    });

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
  *   서버에서 이미지 가져와서 app file system안에 저장
  */
  $scope.fileDownload = function(){
    if(!$scope.downloaded){
      $scope.downloaded = true;
      for (var i = 0; i < cardList.cards.length; i++) {
        // if(i > 3) return;
        var fileName = cardList.cards[i].img_path;
        if(fileName != ''){
          var filePath = mServerUploadThumb + fileName;
          var targetPath = cordova.file.dataDirectory+ 'cardImage/' + fileName;
          var options = {};
          var trustHosts = true;

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
  * 현재 id보다 큰 card를 가져와서 메인에 추가함
  * 수정/삭제 된 card를 cover할 수 없으므로 현재 사용하지 않고 보류중
  */
  $scope.getNewCards = function() {

    //app에서 띄운 webview가 아니거나 online일 경우만
    if (!(mIsWebView) || $cordovaNetwork.isOnline()) {

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
            if(data.cards[i].img_path == '') data.cards[i].img_path = mNoImageThumb;
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
        title: mAppName,
        template: '인터넷에 연결 상태를 확인하세요',
        cssClass: 'wcm-error',
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

    $scope.noMoreItemsAvailable = true;

    $timeout( function() { 
      //app에서 띄운 webview가 아니거나 online일 경우만
      if (!(mIsWebView) || $cordovaNetwork.isOnline()) {
        /* isOnline */  
        // init이면 처음 페이지 데이터를 다시 가져옴
        if(init == 'init'){

          $ionicLoading.show({
            template: '<ion-spinner icon="bubbles"></ion-spinner><br/>로딩중..'
          });
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
            $ionicLoading.hide();
            window.localStorage['cardList'] = JSON.stringify(data);
          });

          request.error(function(error){
            $ionicLoading.hide();
            console.log('error : ' + JSON.stringify(error))
          })
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
            
            if (data.cards[i].status === PROGRESS_START) {
              data.cards[i].statusDescription = PROGRESS_START_TEXT;
              data.cards[i].statusIcon = "project-start";
            } else if (data.cards[i].status === PROGRESS_ONGOING) {
              data.cards[i].statusDescription = PROGRESS_ONGOING_TEXT;
              data.cards[i].statusIcon = "project-ongoing";
            } else {
              data.cards[i].statusDescription = PROGRESS_COMPLETED_TEXT;
              data.cards[i].statusIcon = "project-complete";
            }

            if (data.cards[i].img_path == '') {
              data.cards[i].img_path = mNoImageThumb;
            } else {
              data.cards[i].img_path = mServerUploadThumb + data.cards[i].img_path;
            }

            data.cards[i].address = data.cards[i].location_name;
            if(data.cards[i].user[0].userimage != null){
              data.cards[i].user[0].userimage = data.cards[i].user[0].userimage;
            }

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

        //Stop the ion-refresher from spinning
        $scope.$broadcast('scroll.refreshComplete');  
      } else {

        /* isOffline */
        $ionicPopup.alert({
          title: mAppName,
          template: '인터넷에 연결 상태를 확인하세요',
          cssClass: 'wcm-error',
        });

        // 미리 가져온 cardlist 사용
        // $scope.offlineCard();
        
        //Stop the ion-refresher from spinning
        $scope.$broadcast('scroll.refreshComplete');
      }
    },100);
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
        cardList.cards[i].img_path = mNoImageThumb;
      }
      $rootScope.allData.cards.push(cardList.cards[i]);
    }
  }

  /*
  * sort버튼을 눌렀을 때 popover show
  * $event 클릭된 event
  */
  $scope.openPopover = function ($event) {
    console.log('openPopover');
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
    console.log("sortBy sortType : " + sortType);
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

    request.error(function(error){
      $ionicLoading.hide();
      console.log('sort error : ' + JSON.stringify(error))
    });
    request.success(function(data) { 
      console.log("sort success data : " + JSON.stringify(data));

      $rootScope.allData.cards = [];

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
        } else {
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
    var confirmPopup = $ionicPopup.confirm({
      title: mAppName,
      template: '정말로 지우시겠습니까?',
      cssClass: 'wcm-negative',
    });

    confirmPopup.then(function(res) {

      if(res) {
        var request = $http({
            method: "get",
            url: mServerAPI + "/cardDetail/" + id + "/delete",
            crossDomain : true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
        });

        request.success(function() {
          location.reload();
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
    document.getElementById('welcomeOverlay').setAttribute('style','display:none');
    console.log('overlayClose Preferences != undefined : ' + (typeof Preferences != 'undefined'));
    //닫고나 면 무조건 다시보지 않기
    Preferences.put('notShowPref', true); 
  }

  $scope.showDialog = function (card) { 
    CardService.share('facebook', card);
  }

});
