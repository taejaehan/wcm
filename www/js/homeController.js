wcm.controller("HomeController", function($scope, $rootScope, $cordovaNetwork, $state, $ionicPopup, $cordovaCamera, $http, $timeout, $stateParams, $cordovaFile, $cordovaFileTransfer, $ionicPopover, $cordovaGeolocation, $cordovaOauth,$ionicPlatform) {
  navigator.geolocation.watchPosition(showPosition);
  var user = JSON.parse(window.localStorage['user'] || '{}');
  var cardList = JSON.parse(window.localStorage['cardList'] || '{}');

  //sort type
  $scope.sortingTypeList = [
    { text: "등록순", value: "registration" },
    { text: "거리순", value: "location" },
    { text: "위험도", value: "warning" }
  ];
  //sort type default value
  $scope.data = {
    sortingType: 'registration'
  };

  $scope.downloaded = false;
  $scope.page = 0;
  $rootScope.allData = { 
                          cards: []
                       };


  /*
  * deviceready > app file system안에 폴더만들고 이미지 저장, 인터넷 연결 listener
  */
  $ionicPlatform.ready(function() {
    console.log('deviceready');

    //앱에서 켰다면 
    if(ionic.Platform.isWebView()){

      // card이미지를  file system에 저장하는 부분 임시로 주석처리 by tjhan 20151002
      // console.log('cordova.file : ' + cordova.file);
      // console.log('cordova.file.dataDirectory : ' + cordova.file.dataDirectory);

      // //cordova.file.dataDirectory안에 cardImage 디렉토리 (없다면 만들고) 안에 이미지 다운로드 시작
      // $cordovaFile.checkDir(cordova.file.dataDirectory, "cardImage")
      // .then(function (success) {
      //   console.log('checkDir success : ' + JSON.stringify(success));
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
        template: 'Check your network connection.'
      });

      //미리 가져온 cardlist 사용
      $scope.offlineCard();

      //Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');
    }
  }

  /*
  * card를 새로 가져옴
  * @param : init(String) 'init'이면 처음 페이지 데이터를 다시 가져옴
  */
  $scope.doRefresh = function(init) {

    console.log('doRefresh - page : ' + $scope.page);
    //app에서 띄운 webview가 아니거나 online일 경우만
    if (!(ionic.Platform.isWebView()) || $cordovaNetwork.isOnline()) {
      /* isOnline */  
      $timeout( function() {
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

        var formData = { 
                        lat: $scope.currentLat,
                        lon: $scope.currentLon
                      };

        console.log('lat : ' + $scope.currentLat + 'lon : ' + $scope.currentLon);

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
            data.cards[i].user[0].userimage = data.cards[i].user[0].userimage.split("amp;").join("&");
            var object =  data.cards[i];
            $rootScope.allData.cards.push(object);

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

          $scope.page++;
          $scope.$broadcast('scroll.infiniteScrollComplete');  

        });

        //Stop the ion-refresher from spinning
        $scope.$broadcast('scroll.refreshComplete');  
      },1000);
  
    } else {

      /* isOffline */
      $ionicPopup.alert({
        title: 'We Change Makers',
        template: 'Check your network connection.'
      });

      //미리 가져온 cardlist 사용
      $scope.offlineCard();
      
      //Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');
    }
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

        data.cards[i].address = data.cards[i].location_name;

        var object =  data.cards[i];
        $rootScope.allData.cards.push(object);

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
      console.log("success");
      $scope.page++;

      $scope.$broadcast('scroll.infiniteScrollComplete');  
    });

  }



  /*
  * popover창에서 sort type을 변경 했을 때 호출됨
  */
  $scope.sortingTypeChange = function(item) {
    // console.log("sortingTypeChange, text:", item.text, "value:", item.value);

    if (item.value == 'registration') {
      $scope.sortBy(item.value);
    } else if (item.value == 'warning') {
      $scope.sortBy(item.value);
    } else if (item.value == 'location') {
      $scope.sortBy(item.value);
    }

    //   var myLatlng ; 
    //   var posOptions = {
    //           enableHighAccuracy: true,
    //           timeout: 20000,
    //           maximumAge: 0
    //       };
    //   $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
    //       var lat  = position.coords.latitude;
    //       var long = position.coords.longitude;
           
    //       myLatlng = new google.maps.LatLng(lat, long);
    //       console.log('myLatlng : ' + myLatlng);
    //       for(var j = 0; j < $rootScope.allData.cards.length; j ++) {
    //         var lat  = $rootScope.allData.cards[j].location_lat;
    //         var long = $rootScope.allData.cards[j].location_long;
    //         var cardLatlng = new google.maps.LatLng(lat, long);
    //         console.log('cardLatlng : ' + cardLatlng);
    //         var distance = $scope.getDistance(myLatlng, cardLatlng);
    //         $rootScope.allData.cards[j].distance = distance;
    //         console.log('distance : ' + $rootScope.allData.cards[j].distance);
    //       };

    //   }, function(err) {
    //       alert('You can not use the location information');
    //       console.log('CURRENT LOCATION ERROR :  ' + err);
    //   });
    // }
  };

  /*
  * 2개 pos간의 거리 계산
  */
  $scope.getDistance  = function(p1, p2) {
    var rad = function(x) {
      return x * Math.PI / 180;
    };
    var R = 6378137; // Earth’s mean radius in meter
    var dLat = rad(p2.lat() - p1.lat());
    var dLong = rad(p2.lng() - p1.lng());
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
      Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d; // returns the distance in meter
  };
  /*
  * warnings map show
  */
  $scope.findWarning = function() {
    $state.go("tabs.map");
  }
  /*
  * 각 card의 location map show
  */
  $scope.showMap = function(lat, lon) {
    var latlng = new google.maps.LatLng(lat, lon);
    $state.go('tabs.location_h', { 'latlng': latlng});
  }

  // =========================== Check current user & card user =============================

  $scope.userChecked = function(card) {
 
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
  
  $scope.editCard = function(id) {
    $state.go('tabs.edit', { 'id': id});
  };

  // ==================================== post like_count ======================================

  $scope.toggleLike = function(e, id) {
    if (user.isAuthenticated === true) {

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
  // ==================================== post like_count END ======================================

  
});




