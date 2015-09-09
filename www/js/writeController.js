wcm.controller("WriteController", function($scope, $state, $cordovaCamera, $cordovaFile, $cordovaFileTransfer, $timeout, $cordovaGeolocation, $ionicLoading, $http, $stateParams, $ionicPopup) {

  var latlng ;

  // ==================================== Camera ======================================  

    $scope.$on('$ionicView.afterEnter', function(){

      if($scope.imgURI == null){
        $scope.takePicture();
      }else{
        $scope.currentLocation();
      }
    });

    /*사진 찍기*/
    $scope.takePicture = function(){

      //device가 undefined이면 사진을 찍지 않고 바로 위치정보로 넘어감
      var platform;
      if(typeof device != 'undefined'){
        platform = device.platform;;
      }else{
        $scope.currentLocation();
        return;
      };

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
          sourceType: Camera.PictureSourceType.CAMERA
          // sourceType: Camera.PictureSourceType.PHOTOLIBRARY
          // saveToPhotoAlbum: true  /*android 일 경우 해당 옵션을 사용하면 capture되지 않음*/
      };
      if(platform == 'iOS'){
        options['saveToPhotoAlbum'] = true;
      }

      $cordovaCamera.getPicture(options).then(function(imagePath){
        // $scope.imgURI = "data:image/jpeg;base64," + imageData;
        $scope.imgURI = imagePath;
        $scope.cardForm.file.$setTouched();
        $scope.cardForm.file.$setViewValue(imagePath);

        $scope.currentLocation();
      }, function(error){
        //An error occured
        $ionicPopup.alert({
           title: 'getPicture error',
           template: error
         });
        $scope.currentLocation();
      });
    }

  // ==================================== Camera END ====================================== 

  // ==================================== Location ====================================== 

    /*현재 위치 가져오기*/
    $scope.currentLocation = function(){

      if(document.getElementById("card_location").value != '') return;

      $ionicLoading.show({
          template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Acquiring location!'
      });
       
      var posOptions = {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
      };

      $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
          var lat  = position.coords.latitude;
          var long = position.coords.longitude;
          latlng = new google.maps.LatLng(lat, long);
          var geocoder = new google.maps.Geocoder;

          geocoder.geocode({'location': latlng}, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
              if (results[1]) {
                console.log('results[1].formatted_address) : ' + results[1].formatted_address);
                document.getElementById("card_location").setAttribute('lat' , lat);
                document.getElementById("card_location").setAttribute('long' , long);
                document.getElementById("card_location").value = results[1].formatted_address;

                // 해당 input을 valid시킴
                // $scope.cardForm.location.$setDirty();
                $scope.cardForm.location.$setTouched();
                $scope.cardForm.location.$setViewValue(results[1].formatted_address);

                console.log('$scope.cardForm.location.$valid : ' + $scope.cardForm.location.$valid);

              } else {
               $ionicPopup.alert({
                 title: 'google map error',
                 template: 'No results found'
               });
              }
            } else {
              $ionicPopup.alert({
                 title: 'google map error',
                 template: status
               });
            }
          });
          $ionicLoading.hide();           
           
      }, function(err) {
          $ionicLoading.hide();
          console.log(err);
      });
    }

    /*맵 보여주기*/
    $scope.showMap = function() {
      $state.go('tabs.location', { 'latlng': latlng});
    }

  // ==================================== Location END ======================================  

  // ==================================== Post card ====================================== 

    $scope.cardData = {
                        "title" : "",
                        "description" : "",
                        "location":"",
                        "imgPath":""
                      };

    /*작성한 카드 업로드*/
    $scope.uploadCard = function(form) {

      //form 밖의 버튼이므로 submit이 처리되지 않으므로 submit처리하여 invalid error를 보여준다
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

     //서버에 파일 저장하기
      var newFileName;
      if($scope.imgURI != null){
        
        var imagePath = $scope.imgURI;
        
        //날짜로 이름 생성
        var d = new Date();
        var n = d.getTime();

        newFileName = n + ".jpg";

        var url = mServerAPI + "/upload";
        var targetPath = imagePath;
        var filename = targetPath.split("/").pop();
        var options = {
            fileKey: "file",
            fileName: newFileName,
            chunkedMode: false,
            mimeType: "image/jpg"
        };

        $cordovaFileTransfer.upload(url, targetPath, options).then(function(result) {
            console.log(JSON.stringify(result.response));

            if (window.localStorage['user'] != null) {
              var user = JSON.parse(window.localStorage['user'] || '{}');
              $scope.userid = user.id;
              $scope.username = user.properties.nickname;
              $scope.userimage = user.properties.thumbnail_image;       
            }

            //DB 저장하기 시작
            var title = document.getElementById("card_title").value;
            var user_app_id = $scope.userid;
            var username = $scope.username;
            var userimage = $scope.userimage; 
            var description = document.getElementById("card_des").value;
            var location_lat =  document.getElementById("card_location").getAttribute('lat');
            var location_long = document.getElementById("card_location").getAttribute('long');
            var img_path = mServerUrl+"/upload/"+newFileName;
            var formData = {
                        user_app_id: user_app_id,
                        username: username,
                        userimage: userimage,
                        title: title,
                        description: description,
                        location_lat: location_lat,
                        location_long: location_long,
                        img_path: img_path
                };
            var postData = 'cardData='+JSON.stringify(formData);
            var request = $http({
                method: "post",
                url: mServerAPI + "/card",
                crossDomain : true,
                data: postData,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
                cache: false
            });
            request.success(function(data) {

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

                $state.go('tabs.home');
                
                $ionicLoading.hide();

                $ionicPopup.alert({
                  title: 'Success',
                   template: 'data :  ' + data
                });
            });
            //DB 저장하기 끝

        }, function(err) {
          $ionicLoading.hide();
          console.log(JSON.stringify(err));
        }, function (progress) {
          $ionicLoading.hide();
          // constant progress updates
          $timeout(function () {
            $scope.downloadProgress = (progress.loaded / progress.total) * 100;
          })
        });
      }

    }

  // ==================================== Post card END ====================================== 

  // ==================================== Edit card ======================================  

  /* Get card info */

  $scope.postId = $stateParams.postId;

  var request = $http({
    method: "get",
    url: mServerAPI + "/cardDetail/" + $scope.postId,
    crossDomain : true,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    cache: false
  });

  request.success(function(data) {
    $scope.postTitle = data.cards[0].title;
    $scope.postDescription = data.cards[0].description;
    $scope.postImage = data.cards[0].img_path;
    $scope.lat = data.cards[0].location_lat;
    $scope.lng = data.cards[0].location_long;

  });

  /* Get card info END */


  /* Post card info */

  $scope.editCard = function() {

    /* Upload image file */

    var newFileName;
    if($scope.imgURI != null){
      
      var imagePath = $scope.imgURI;
      var d = new Date();
      var n = d.getTime();

      newFileName = n + ".jpg";

      var url = mServerAPI + "/upload";
      var targetPath = imagePath;
      var filename = targetPath.split("/").pop();
      var options = {
          fileKey: "file",
          fileName: newFileName,
          chunkedMode: false,
          mimeType: "image/jpg"
      };
      $cordovaFileTransfer.upload(url, targetPath, options).then(function(result) {
          console.log("SUCCESS: " + JSON.stringify(result.response));
          alert("success");
          alert(JSON.stringify(result.response));
      }, function(err) {
          console.log("ERROR: " + JSON.stringify(err));
          alert(JSON.stringify(err));
      }, function (progress) {
          // constant progress updates
          $timeout(function () {
          $scope.downloadProgress = (progress.loaded / progress.total) * 100;
        })
      });
    }

    /* Upload image file END */

    var title = document.getElementById("card_title").value;
    var description = document.getElementById("card_des").value;
    var location_lat =  document.getElementById("card_location").getAttribute('lat');
    var location_long = document.getElementById("card_location").getAttribute('long');
    var img_path = mServerUrl+"/upload/"+newFileName;
    var formData = {
                      title: title,
                      description: description,
                      location_lat: location_lat,
                      location_long: location_long,
                      img_path: img_path
                    };
    var postData = 'cardData='+JSON.stringify(formData);
    var request = $http({
        method: "post",
        url: mServerAPI + "/cardDetail/" + $scope.postId,
        crossDomain : true,
        data: postData,
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        cache: false
    });

    request.success(function(data) {
      $state.go("tabs.home");
    });

  }

  /* Post card info END */

  // ==================================== Edit card END ======================================

});

