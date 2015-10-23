wcm.controller("WriteController", function($scope, $rootScope, $state, $cordovaCamera, $cordovaFile, $cordovaFileTransfer, $timeout, $cordovaGeolocation, $ionicLoading, $http, $stateParams, $ionicPopup, $ionicActionSheet, $ionicHistory) {

  var user = JSON.parse(window.localStorage['user'] || '{}');
  var latlng, progress;
  var imgPath = '';

  $scope.cardId;
  $scope.cardData = {};
  $scope.cancelClick = false;
  $scope.uploadTitle = '';
  
  $scope.$on('$ionicView.afterEnter', function(){

    if (user != null && user.isAuthenticated === true) {
      //id가 없다면 add
      if($stateParams.id == null){
        $scope.uploadTitle = 'Add';
        
        if ($rootScope.cardLocation == undefined || $rootScope.cardLocation == '') {
          $scope.currentLocation();
        };
        // if(!($ionicHistory.viewHistory().forwardView != null 
        //   && $ionicHistory.viewHistory().forwardView != null 
        //   && $ionicHistory.viewHistory().forwardView.stateName == "tabs.location_w")){
        //   $scope.currentLocation();
        // }
      }
      //id가 있으면 해당 card edit
      else{
        $scope.uploadTitle = 'Edit';
        if($scope.cardId == null){
          $scope.cardId = $stateParams.id;
          if($ionicHistory.forwardView() == null || $ionicHistory.forwardView().stateName != 'tabs.location_h'){
            $scope.getCard();
          }
        }
      }
    }

    if ($rootScope.cardTitle != undefined) {
      document.getElementById('card_title').value = $rootScope.cardTitle;
      $scope.cardForm.title.$setViewValue($rootScope.cardTitle);
    }

    if ($rootScope.cardDescription != undefined) {
      document.getElementById('card_des').value = $rootScope.cardDescription;
      $scope.cardForm.description.$setViewValue($rootScope.cardDescription);
    }

    if ($rootScope.cardFile != undefined) {
      // document.getElementById('card_file').value = $rootScope.cardFile;
      $scope.imgURI =$rootScope.cardFile;
      $scope.cardForm.file.$setTouched();
      $scope.cardForm.file.$setViewValue($rootScope.cardFile);
    }

    if ($rootScope.cardLocation != undefined) {
      if(document.getElementById("card_location") != null){
        document.getElementById('card_location').value = $rootScope.cardLocation;
        document.getElementById('card_location').setAttribute('lat' , $rootScope.cardLocationLat);
        document.getElementById('card_location').setAttribute('long' , $rootScope.cardLocationLng);
        document.getElementById('card_location').validity.valid = true;
        $scope.cardForm.location.$setViewValue($rootScope.cardLocation);
      }
    }
  });

  //DOM에서 view가 사라질때 (현재 버젼에서는 tab을 이동하거나 같은 tab에서 다른 view로 이동시 발생함) 
  $scope.$on('$ionicView.unloaded', function(){
    console.log('writeController unloaded - cancelClick : ' + $scope.cancelClick);
    //$scope.cardId가 null이고(새로 글쓰는 상태에서) cancel를 클릭하여 다른 view나 tab으로 간것이 아니라면)
    if(($scope.cardId == null && !$scope.cancelClick) 
      || $ionicHistory.currentView().stateName == 'tabs.location_h'){
      $rootScope.cardTitle = $scope.cardData.title;
      $rootScope.cardDescription = $scope.cardData.description;
      $rootScope.cardFile = $scope.cardData.file;
      $rootScope.cardLocation = document.getElementById("card_location").value;
      $rootScope.cardLocationLat = document.getElementById("card_location").getAttribute('lat');
      $rootScope.cardLocationLng = document.getElementById("card_location").getAttribute('long');
    }else{
      //reset inputs datas
      delete $rootScope.cardTitle;
      delete $rootScope.cardDescription;
      delete $rootScope.cardFile;
      delete $rootScope.cardLocation;
      delete $rootScope.cardLocationLat;
      delete $rootScope.cardLocationLng;
    }

  });


  /*
  * 카메라 또는 앨범을 선택할 수 있는 시트를 보여준다
  */
  $scope.showPictureSheet = function(){
    // Show the action sheet
   var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '새로 찍기' },
       { text: '앨범에서 선택' }
     ],
     // destructiveText: 'Delete',
     titleText: '사진 첨부하기',
     cancelText: '취소',
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
    if(mIsWebView){
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
          correctOrientation : true,
          // sourceType: Camera.PictureSourceType.CAMERA
          // sourceType: Camera.PictureSourceType.PHOTOLIBRARY
          // saveToPhotoAlbum: true  /*android 일 경우 해당 옵션을 사용하면 capture되지 않음*/
      };
      if(index == 0){
        options['sourceType'] = Camera.PictureSourceType.CAMERA
        //ios일 경우 찍은 사진을 앨범에 저장
        if(mIsIOS){
          options['saveToPhotoAlbum'] = true;
        }
      }else if(index == 1){
        options['sourceType'] = Camera.PictureSourceType.PHOTOLIBRARY
      }

      $cordovaCamera.getPicture(options).then(function(imagePath){
        $scope.imgURI = imagePath;
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
      $scope.imgURI = 'img/default.png';
      $scope.cardForm.file.$setTouched();
      $scope.cardForm.file.$setViewValue('img/default.png');
    };
  }
  /*
  * 현재 위치 가져오기
  */
  $scope.currentLocation = function(){

    if(document.getElementById("card_location") != null && document.getElementById("card_location").value != '') return;

    $ionicLoading.show({
        template: '<ion-spinner icon="bubbles"></ion-spinner><br/>위치를 찾고 있습니다',
        duration : 5000,
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
          template: '위치 정보를 사용할 수 없습니다'
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
            $rootScope.cardLocation = results[1].formatted_address;
            $rootScope.cardLocationLat = latlng.lat;
            $rootScope.cardLocationLng = latlng.lng;
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
    if($scope.cardId == null){
      $state.go('tabs.location_w', { 'latlng': latlng});
    }else{
      $state.go('tabs.location_h', { 'latlng': latlng, 'progress' : progress});
      //맵을 보여준 후 dirty설정
      $scope.cardForm.location.$setDirty();
    };
    // $scope.cardForm.location.$setViewValue('done');
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
         title: '잠시만요!',
         template: '모든 내용을 입력해주세요'
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
      //$scope.cardId가 null이면 (new add)
      if($scope.cardId == null){ 
        $scope.savePicture();
      }else{ //$scope.cardId가 있을 경우(edit일 경우)

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

    var options = {
        fileKey: "file",
        fileName: newFileName,
        chunkedMode: false,
        mimeType: "image/jpg"
    };

    console.log('url :  ' + url);
    console.log('targetPath :  ' + targetPath);
    console.log('options :  ' + options);

    if(mIsWebView){

      console.log('$cordovaFileTransfer :  ' + $cordovaFileTransfer);

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

    //user관련 부분이 없으면 테스트 용도로 facebook 정보를 넣어준다
    if (window.localStorage['user'] != null) {
      var user = JSON.parse(window.localStorage['user'] || '{}');
      $scope.userid = user.userid;  
    }else{
      $scope.userid = 1826451354247937;
    }
    if($scope.userid == null){
      $scope.userid = 1826451354247937;
    }

    console.log("userId : "  + $scope.userid);

    var user_app_id = $scope.userid;

    var url, title, description, location_lat, location_long, location_name= '';
    //$scope.cardId가 null이면 (new add)
    if($scope.cardId == null){
      url = mServerAPI + "/card";
      title = document.getElementById("card_title").value;
      description = document.getElementById("card_des").value;
      location_lat =  document.getElementById("card_location").getAttribute('lat');
      location_long = document.getElementById("card_location").getAttribute('long');
      location_name = document.getElementById("card_location").value;
      if(newFileName != null) {
        imgPath = newFileName;
      }
    }else{  //$scope.cardId가 있으면 (edit)
      if($scope.cardForm.title.$dirty ||
        $scope.cardForm.description.$dirty ||
        $scope.cardForm.location.$dirty ||
        $scope.cardForm.file.$dirty){
          url = mServerAPI + "/cardDetail/" + $scope.cardId;
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

        if ($rootScope.allData.cards[i].id === $scope.cardId) {
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

        $scope.cancelCard();
        
        $ionicLoading.hide();

        $ionicPopup.alert({
          title: 'We change Makers',
          template: '게시물이 성공적으로 등록되었습니다.'
        });
    });
    request.error(function(error){
      console.log('error : ' + JSON.stringify(error));
      $ionicLoading.hide();

      $ionicPopup.alert({
        title: 'We change Makers',
        template: '잠시 후에 다시 시도해주세요.'
      });
    });
  }

  /* 
  * Get card info 
  */
  $scope.getCard = function() {

    if($scope.cardId == null) return;
    var request = $http({
      method: "get",
      url: mServerAPI + "/cardDetail/" + $scope.cardId,
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
      document.getElementById("change_pic").setAttribute('style' , 'display:none');


      var lat = data.cards[0].location_lat;
      var long = data.cards[0].location_long;
      document.getElementById("card_location").setAttribute('lat' , lat);
      document.getElementById("card_location").setAttribute('long' , long);

      $scope.setLocationName(lat, long);
    });
  }
  /*
  * cancel버튼을 누르거나 upload완료시에 발생
  */
  $scope.cancelCard = function() {

    console.log('writeController cancelCard');
    $scope.cancelClick = true;
    //history를 없애서 write afterenter시에 forwardView를 판단하는 부분을 reset
    $ionicHistory.clearHistory();
    //reset inputs datas
    delete $rootScope.cardTitle;
    delete $rootScope.cardDescription;
    delete $rootScope.cardFile;
    delete $rootScope.cardLocation;
    delete $rootScope.cardLocationLat;
    delete $rootScope.cardLocationLng;

    $state.go('tabs.home');
    
  }

});

