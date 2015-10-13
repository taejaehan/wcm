wcm.controller("WriteController", function($scope, $rootScope, $state, $cordovaCamera, $cordovaFile, $cordovaFileTransfer, $timeout, $cordovaGeolocation, $ionicLoading, $http, $stateParams, $ionicPopup, $ionicActionSheet, $ionicHistory) {

  var user = JSON.parse(window.localStorage['user'] || '{}');
  var latlng, cardId, progress;
  var imgPath = '';

  $scope.cardData = {
    // "title" : "",
    // "description" : "",
    // "location":"",
    // "imgPath":""
  };

  $scope.imgCheck = false;

  $scope.submitDisabled = true;

  $scope.$on('$ionicView.afterEnter', function(){

    $scope.submitDisabled = false;
    
    if (user != null && user.isAuthenticated === true) {

      //id가 없다면 add
      if($stateParams.id == null){
        $scope.uploadTitle = 'Add';
        if(!($ionicHistory.viewHistory().forwardView != null 
          && $ionicHistory.viewHistory().forwardView.stateName == "tabs.location_w")){
          $scope.currentLocation();
        }
        
      }
      //id가 있으면 해당 card edit
      else{
        $scope.uploadTitle = 'Edit';
        if(cardId == null){
          cardId = $stateParams.id;
          $scope.getCard();
        }
      }
    }

    if ($rootScope.cardTitle != undefined) {
      document.getElementById('card_title').value = $rootScope.cardTitle;
    }

    if ($rootScope.cardDescription != undefined) {
      document.getElementById('card_des').value = $rootScope.cardDescription;
    }

    if ($rootScope.cardFile != undefined) {
      document.getElementById('card_file').value = $rootScope.cardFile;
    }

  });



  /*
  * 카메라 또는 앨범을 선택할 수 있는 시트를 보여준다
  */
  $scope.showPictureSheet = function(){

    // Show the action sheet
   var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: 'Camera' },
       { text: 'Album' }
     ],
     // destructiveText: 'Delete',
     titleText: 'Get Picture',
     cancelText: 'Cancel',
     cancel: function() {
        // add cancel code..
      },
     buttonClicked: function(index) {
        console.log('index :  ' + index);
        $scope.getPicture(index);
        return true;
     },
   });

  }
  /*
  * 사진 가져오기
  * @param index : 0 = camera , 1 = album
  */
  $scope.getPicture = function(index){
    //device가 undefined이면 사진을 찍지 않고 바로 위치정보로 넘어감
    // var platform;
    // if(typeof device != 'undefined'){
    //   platform = device.platform;;
    // }else{
    //   // $scope.currentLocation();
    //   return;
    // };
    $scope.imgCheck = true;
    if(ionic.Platform.isWebView()){
      var options = { 
          quality : 100, 
          destinationType : Camera.DestinationType.FILE_URI, 
          sourceType : Camera.PictureSourceType.CAMERA, 
          // allowEdit : true,  //사진 찍은 후 edit 여부
          encodingType: Camera.EncodingType.JPEG,
          cameraDirection: 0, //back : 0 , front : 1
          targetWidth: 300,
          targetHeight: 300,
          popoverOptions: CameraPopoverOptions,   //ios only 
          // sourceType: Camera.PictureSourceType.CAMERA
          // sourceType: Camera.PictureSourceType.PHOTOLIBRARY
          // saveToPhotoAlbum: true  /*android 일 경우 해당 옵션을 사용하면 capture되지 않음*/
      };
      if(index == 0){
        options['sourceType'] = Camera.PictureSourceType.CAMERA
        //ios일 경우 찍은 사진을 앨범에 저장
        if(ionic.Platform.isIOS()){
          options['saveToPhotoAlbum'] = true;
        }
      }else if(index == 1){
        options['sourceType'] = Camera.PictureSourceType.PHOTOLIBRARY
      }

      $cordovaCamera.getPicture(options).then(function(imagePath){
        // $scope.imgURI = "data:image/jpeg;base64," + imageData;
        // alert('imagePath :' + imagePath);
        $scope.imgURI = imagePath;
        $scope.imgCheck = true;
        $scope.cardForm.file.$setTouched();
        $scope.cardForm.file.$setViewValue(imagePath);

      }, function(error){
        //An error occured
        $ionicPopup.alert({
           title: 'getPicture error',
           template: error
         });
      });
    }else{
      // cordova같은 webview가 아니고 index(1) 앨범을 선택한 경우 임시로 테스트 사진을 넣어준다
     // if(index == 1){
     //    document.getElementById("card_file_hidden").click();
     //  }
      $scope.imgURI = 'http://placehold.it/100x100';
      $scope.cardForm.file.$setTouched();
      $scope.cardForm.file.$setViewValue('http://placehold.it/100x100');
    };
  }
  /*
  * 현재 위치 가져오기
  */
  $scope.currentLocation = function(){

    if(document.getElementById("card_location") != null && document.getElementById("card_location").value != '') return;

    $ionicLoading.show({
        template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Acquiring location!'
    });
    
    var posOptions = {
        enableHighAccuracy: true,
        timeout: 4000,
        maximumAge: 0
    };

    $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {

        var lat  = position.coords.latitude;
        var long = position.coords.longitude;
        $scope.setLocationName(lat, long);

        $ionicLoading.hide();
    }, function(err) {

        $ionicLoading.hide();
        $ionicPopup.alert({
           title: 'We Change Makers',
           template: 'You can not use the location information'
         });
        //서울 초기값 세팅
        var lat  = 37.574515;
        var long = 126.976930;
        $scope.setLocationName(lat, long);
        
        console.log(err);
    });


  }

  /*
  * 위치 이름을 가져옵니다 
  * @param : latlng - {위도, 경도} 
  */
  $scope.setLocationName = function(lat, long){
    latlng = new google.maps.LatLng(lat, long);
    var geocoder = new google.maps.Geocoder;
    geocoder.geocode({'location': latlng}, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          console.log('results[1].formatted_address) : ' + results[1].formatted_address);
          if(document.getElementById("card_location") != null){
            document.getElementById("card_location").setAttribute('lat' , lat);
            document.getElementById("card_location").setAttribute('long' , long);
            document.getElementById("card_location").value = results[1].formatted_address;
          }
          // 해당 input을 valid시킴
          // $scope.cardForm.location.$setDirty();
          $scope.cardForm.location.$setTouched();
          $scope.cardForm.location.$setViewValue(results[1].formatted_address);
          $scope.cardForm.location.$setPristine();

          console.log('$scope.cardForm.location.$valid : ' + $scope.cardForm.location.$valid);

        } else {
         $ionicPopup.alert({
           title: 'google map error',
           template: 'No results found'
         });
        }

        $ionicLoading.hide();
      } else {
        $ionicPopup.alert({
           title: 'google map error',
           template: status
         });
        $ionicLoading.hide();
      }
    });
  }

  /*맵 보여주기*/
  $scope.showMap = function() {
    console.log('showMap latlng : ' + latlng);
    if(cardId == null){
      $state.go('tabs.location_w', { 'latlng': latlng});
    }else{
      $state.go('tabs.location_h', { 'latlng': latlng, 'progress' : progress});
      //맵을 보여준 후 dirty설정
      $scope.cardForm.location.$setDirty();
    };

    $scope.cardForm.location.$setViewValue('done');

    

    // if ($rootScope.cardTitle == undefined) {
    //   $rootScope.cardTitle = $scope.cardData.title;
    // } 

    // if ($rootScope.cardDescription == undefined) {
    //   $rootScope.cardDescription = $scope.cardData.description;
    // } 

    // if ($rootScope.cardFile == undefined) {
    //   $rootScope.cardFile = $scope.cardData.file;
    // } 

    $rootScope.cardTitle = $scope.cardData.title;
    $rootScope.cardDescription = $scope.cardData.description;
    $rootScope.cardFile = $scope.cardData.file;

  }

  /*
  * 카드를 업로드 한다
  * @param : form - submit할 form
  */
  $scope.uploadCard = function(form) {

    //form 밖의 버튼이라서 submit이 처리되지 않으므로 submit처리하여 invalid error를 보여준다
    $scope.cardForm.$setSubmitted();

    if(form.$invalid){
      $ionicPopup.alert({
         title: 'Invalid',
         template: 'Fill in all the fields'
       });
      return;
    }

    $ionicLoading.show({
        template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Uploading'
    });

    console.log('$scope.imgURI : ' + $scope.imgURI);
    console.log('file dirty : ' + $scope.cardForm.file.$dirty);

    //찍은 사진이 있다면 
    if($scope.imgURI != null){ 
      //cardId가 null이면 (new add)
      if(cardId == null){ 
        $scope.savePicture();
      }else{ //cardId가 있을 경우(edit일 경우)

        //file을 변경했을 경우에만 다시 저장
        if($scope.cardForm.file.$dirty){
          //이미지 경로 및 이름이 같으면 업로드 하지 않는다
          if(imgPath != $scope.imgURI){
            $scope.savePicture();
            //TODO 예전 사진 삭제 
          }else{
            //이미지 경로 및 이름이 같다면 DB만 업로드
            $scope.uploadDb();
          }
        }else{
          $scope.uploadDb();
        }
      }
    }else{  //사진을 찍을 수 없는 경우 db만 저장한다(web test용도)
      $scope.uploadDb();
    }

  }

  /*
  * 찍은 사진을 서버에 저장하기
  */
  $scope.savePicture = function() {
    //서버에 파일 저장하기
    var newFileName;
    var imagePath = $scope.imgURI;
    
    console.log('$scope.imgURI : ' + $scope.imgURI)
    //날짜로 이름 생성
    var d = new Date();
    var n = d.getTime();

    newFileName = n + ".jpg";

    var url = mServerUrl + '/upload';
    var targetPath = imagePath;
    var filename = targetPath.split("/").pop();

    // var options = new FileUploadOptions();
    // options.fileKey = "file";
    // options.fileName = newFileName;
    // options.mimeType = "image/jpg";
    // options.chunkedMode = false;
    // options.mimeType = "image/jpg";
    
    // var params = {};
    // params.value1 = "test";
    // params.value2 = "param";
    // options.params = params;
    // options.headers = {
    //     Connection: "close"
    // }
    var options = {
        fileKey: "file",
        fileName: newFileName,
        chunkedMode: false,
        mimeType: "image/jpg"
    };
    // options.headers = {
    //     Connection: "close"
    // }
    console.log('url :  ' + url);
    console.log('targetPath :  ' + targetPath);
    console.log('options :  ' + options);

    if(ionic.Platform.isWebView()){
      $cordovaFileTransfer.upload(url, targetPath, options).then(function(result) {
        console.log('success :  ' + JSON.stringify(result.response));
        //서버에 파일을 저장한 후 db를 set
        $scope.uploadDb(newFileName);
      }, function(err) {
        $ionicLoading.hide();
        console.log('error : ' + JSON.stringify(err));
      }, function (progress) {
        $ionicLoading.hide();
        // constant progress updates
        $timeout(function () {
          $scope.downloadProgress = (progress.loaded / progress.total) * 100;
        })
      });
    }else{
      $scope.uploadDb();
    }

  }

  /*
  * card정보를 db에 저장 합니다.
  * @param : newFileName - 서버에 저장된 파일이름
  */
  $scope.uploadDb = function(newFileName) {

    //user관련 부분이 없으면 테스트 용도로 kakao 정보를 넣어준다
    if (window.localStorage['user'] != null) {
      var user = JSON.parse(window.localStorage['user'] || '{}');
      $scope.userid = user.userid;  
    }else{
      $scope.userid = 879359548800156;
    }
    if($scope.userid == null){
      $scope.userid = 879359548800156;
    }

    console.log("userId : "  + $scope.userid);

    var user_app_id = $scope.userid;

    var url, title, description, location_lat, location_long, location_name= '';
    //cardId가 null이면 (new add)
    if(cardId == null){
      url = mServerAPI + "/card";
      title = document.getElementById("card_title").value;
      description = document.getElementById("card_des").value;
      location_lat =  document.getElementById("card_location").getAttribute('lat');
      location_long = document.getElementById("card_location").getAttribute('long');
      location_name = document.getElementById("card_location").value;
      if(newFileName != null) {
        imgPath = newFileName;
      }
    }else{  //cardId가 있으면 (edit)
      if($scope.cardForm.title.$dirty ||
        $scope.cardForm.description.$dirty ||
        $scope.cardForm.location.$dirty ||
        $scope.cardForm.file.$dirty){
          url = mServerAPI + "/cardDetail/" + cardId;
          title = document.getElementById("card_title").value;
          description = document.getElementById("card_des").value;
          location_lat =  document.getElementById("card_location").getAttribute('lat');
          location_long = document.getElementById("card_location").getAttribute('long');
          location_name = document.getElementById("card_location").value;
          if(newFileName != null) {
            imgPath = newFileName;
          }else{
            imgPath = $scope.imgURI.split("/").pop();;
          }
      }else{
        $ionicPopup.alert({
          title: 'No Changed'
        });
        $ionicLoading.hide();
        return;
      }

      var i = 0;

      while( i < $rootScope.allData.cards.length) {

        if ($rootScope.allData.cards[i].id === cardId) {
          $rootScope.allData.cards[i].title = document.getElementById("card_title").value;
          $rootScope.allData.cards[i].img_path = newFileName;
          break;
        }
        i ++;
      }

    }
    var formData = {
            user_app_id: user_app_id,
            title: title,
            description: description,
            location_lat: location_lat,
            location_long: location_long,
            location_name: location_name,
            img_path: imgPath
    };
    var postData = 'cardData='+JSON.stringify(formData);
    var request = $http({
        method: "post",
        url: url,
        crossDomain : true,
        data: postData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
        cache: false
    });
    request.success(function(data) {

        /*if(formData.img_path == ''){
          formData.img_path = mNoImage;
        }
        //home에서 추가/변경된 card update
       if(cardId == null){ 
          //TODO user관련 정보 찾아와서 update할것 
          $rootScope.allData.cards.unshift(formData);
        }else{
          for(var i = 0; i < $rootScope.allData.cards.length ; i++){
            if($rootScope.allData.cards[i].id == cardId){
              $rootScope.allData.cards[i].description = formData.description;
              $rootScope.allData.cards[i].location_lat = formData.location_lat;
              $rootScope.allData.cards[i].location_long = formData.location_long;
              $rootScope.allData.cards[i].location_name = formData.location_name;
              $rootScope.allData.cards[i].img_path = formData.img_path;
            }
          }
        }*/

        //reset inputs
        $scope.cardForm.$setPristine();
        $scope.cardForm.title.$setViewValue('');
        document.getElementById('card_title').value = '';
        $scope.cardForm.description.$setViewValue('');
        document.getElementById('card_des').value = '';
        $scope.cardForm.location.$setViewValue('');
        document.getElementById('card_location').value = '';
        $scope.cardForm.file.$setUntouched();
        $scope.cardForm.file.$setViewValue('');
        $scope.imgURI = undefined;

        delete $rootScope.cardTitle;
        delete $rootScope.cardDescription;
        delete $rootScope.cardFile;

        //go to the home
        $state.go('tabs.home');
        
        $ionicLoading.hide();

        $ionicPopup.alert({
          title: 'We change Makers',
          template: '게시물이 성공적으로 등록되었습니다.'
        });

    });
  }

  /* 
  * Get card info 
  */
  $scope.getCard = function() {

    if(cardId == null) return;
    var request = $http({
      method: "get",
      url: mServerAPI + "/cardDetail/" + cardId,
      crossDomain : true,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      cache: false
    });

    request.success(function(data) {
      $scope.cardData.title = data.cards[0].title;
      $scope.cardData.description = data.cards[0].description;

      progress = data.cards[0].status;
      var imgUrl = data.cards[0].img_path;
      if(imgUrl == ''){
        imgUrl = mNoImage;
      }else{
        imgUrl = mServerUpload + imgUrl;
      }
      $scope.imgURI = imgUrl;
      $scope.cardForm.file.$setTouched();
      $scope.cardForm.file.$setViewValue(imgUrl);
      document.getElementById("card_file").value = imgUrl;
      $scope.cardForm.file.$setPristine();

      var lat = data.cards[0].location_lat;
      var long = data.cards[0].location_long;
      document.getElementById("card_location").setAttribute('lat' , lat);
      document.getElementById("card_location").setAttribute('long' , long);

      $scope.setLocationName(lat, long);
    });
  }

  $scope.cancelCard = function() {
    $state.go('tabs.home');
    delete $rootScope.cardTitle;
    delete $rootScope.cardDescription;
    delete $rootScope.cardFile;
  }

  $scope.test = function() {
    alert("Test");
    console.log("hahah");
  }

});

