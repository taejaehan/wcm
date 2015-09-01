wcm.controller("WriteController", function($scope, $state, $ionicModal, $cordovaFile, $cordovaFileTransfer, $timeout, $cordovaGeolocation, $ionicLoading, $http) {

    var latlng ;

    $scope.$on('$ionicView.afterEnter', function(){

      if(document.getElementById("card_location").innerText != 'location') return;

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
                document.getElementById("card_location").innerText = results[1].formatted_address;
                document.getElementById("card_location").setAttribute('lat' , lat);
                document.getElementById("card_location").setAttribute('long' , long);
              } else {
                window.alert('No results found');
              }
            } else {
              window.alert('Geocoder failed due to: ' + status);
            }
          });
          $ionicLoading.hide();           
           
      }, function(err) {
          $ionicLoading.hide();
          console.log(err);
      });
    });

    $scope.showMap = function() {

      $state.go('tabs.location', { 'latlng': latlng});
    }


    $scope.uploadCard = function(userdata) {


      var newFileName;
      /*서버에 파일 저장하기 시작*/
      if($scope.imgURI != null){
        
        var imagePath = $scope.imgURI;
        // var currentName = imagePath.replace(/^.*[\\\/]/, '');

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
      /*서버에 파일 저장하기 끝*/

      var title = document.getElementById("card_title").value
      var description = document.getElementById("card_des").value
      // var location = document.getElementById("card_location").innerText;
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
          url: mServerAPI + "/card",
          crossDomain : true,
          data: postData,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          cache: false
      });
      /* Successful HTTP post request or not */
      request.success(function(data) {
          alert('data :  ' + data);
      });

    }
});