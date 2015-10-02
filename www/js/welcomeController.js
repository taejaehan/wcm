wcm.controller("WelcomeController", function($scope, $state, $http ,$cordovaOauth, AuthService, $window) {

  // if(window.localStorage['user'] != null) $state.go("tabs.home");
  
  $scope.facebookLogin = function(){

    //webview 앱에서 실행했을 때만 facebook login
    if(ionic.Platform.isWebView()){
      $cordovaOauth.facebook("1020667507964480", ["public_profile"], {redirect_uri: "http://localhost/"}).then(function(result){
            $http.get("https://graph.facebook.com/v2.2/me", {params: {access_token: result.access_token, fields: "name,picture", format: "json" }}).then(function(results) {

                //url 중에 "&"은 "amp;"로 치환해야 에러가 나지 않는다
                var formData = {
                                 user_id: results.data.id,
                                 username: results.data.name,
                                 userimage: results.data.picture.data.url.split("&").join("amp;"),
                                 sns: "fb"
                               };

                $scope.uploadUser(formData);

                // $rootScope.$emit('loginSuccess');
                // window.state.go('tabs.home');
            }, function(error) {
                alert("Error: " + JSON.stringify(error));
            });
      },  function(error){
            alert("Error: " + JSON.stringify(error));
      });
    } else {  //app에서 실행한게 아니면 테스트용도로 넣어줌 

      //url 중에 "&"은 "amp;"로 치환해야 에러가 나지 않는다
      var userImage =  "https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/c15.0.50.50/p50x50/10354686_10150004552801856_220367501106153455_n.jpg?oh=17835c9c962c70d05cc25d75008438a3&oe=5698842F&__gda__=1452879355_4d8b6c5947a3a8359645aff176f54967".split("&").join("amp;");
      var formData = {
                         user_id: "1826451354247937",
                         username: "Dev Major",
                         userimage: userImage,
                         sns: "fb"
                       };
      $scope.uploadUser(formData);
    }
  }


  $scope.skipLogin =function() {
    AuthService.skipLogin();
  }


  $scope.uploadUser = function(formData)
  {
    var userData = 'userData='+JSON.stringify(formData);
    
    var request = $http({
       method: "post",
       url: mServerAPI + "/users",
       crossDomain : true,
       data: userData,
       headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
       cache: false
    });

    /* Successful HTTP post request or not */
    request.success(function(data) {
      // alert('success : '+JSON.stringify(data));
      var user = {
                    username: formData.username,
                    userid: formData.user_id,
                    userimage: formData.userimage.split("amp;").join("&"),
                    isAuthenticated: true
                  };
      
      window.localStorage['user'] = JSON.stringify(user);


      // user가 watch한 게시물 정보 가져오기 
      var request1 = $http({
          method: "get",
          url: mServerAPI + "/like/" + formData.user_id,
          crossDomain : true,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          cache: false
      });

      // user가 change supporters인 게시물 정보 가져오기
      var request2 = $http({
          method: "get",
          url: mServerAPI + "/change/" + formData.user_id,
          crossDomain : true,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          cache: false
      });

      request1.success(function(data1) {
        user.likes = [];
        
        if (data1.likes.length != 0) {
          for(var i = 0; i < data1.likes.length; i++ ) {
            user.likes.push(data1.likes[i].post_id); 
          }
        }
        window.localStorage['user'] = JSON.stringify(user);

        request2.success(function(data2) {
          user.changes = [];
          
          if (data2.changes.length != 0) {
            for(var i = 0; i < data2.changes.length; i++ ) {
              user.changes.push(data2.changes[i].post_id); 
            }
          } 
          window.localStorage['user'] = JSON.stringify(user);

          // $window.location.reload(true);
        });
      }); 

      $state.go("tabs.home");

    })
    .error(function(error){
      alert('ERROR : '+JSON.stringify(error));
    });

  }

});



// wcm.controller("WelcomeController", ["$scope", "$state", "$http", "$cordovaOauth", function($scope, $state, $http ,$cordovaOauth) {
//     // window.cordovaOauth = $cordovaOauth;
//     // window.http = $http;
//     // window.state = $state;

//     alert('WelcomeController');

//     if( window.localStorage['name'] )
//       $state.go('tabs.home');
//     $scope.facebookLogin = function($cordovaOauth, $http)
//     { 
//       alert('facebookLogin');
//       var formData = {
//                          user_id: '123124',
//                          username: 'aaaa',
//                          userimage: 'ttt.png'
//                          sns: "fb"
//                        };
//       $scope.uploadUser(formData);
//       window.cordovaOauth.facebook("1020667507964480", ["public_profile"], {redirect_uri: "http://localhost/"}).then(function(result){
//             window.http.get("https://graph.facebook.com/v2.2/me", {params: {access_token: result.access_token, fields: "name,picture", format: "json" }}).then(function(results) {

//                 console.log('FB results.data : ' + results.data);
//                 console.log('FB results.data.id : ' + results.data.id);
//                 console.log('FB results.data.name : ' + results.data.name);
//                 console.log('FB results.data.picture.data.url : ' + results.data.picture.data.url);

//                 var formData = {
//                                  user_id: results.data.id,
//                                  username: results.data.name,
//                                  userimage: results.data.picture.data.url,
//                                  sns: "fb"
//                                };

//                 $scope.uploadUser(formData);

//                 // $rootScope.$emit('loginSuccess');
//                 // window.state.go('tabs.home');
//             }, function(error) {
//                 alert("Error: " + JSON.stringify(error));
//             });
//       },  function(error){
//             alert("Error: " + JSON.stringify(error));
//       });
//     }

//     $scope.uploadUser = function(formData)
//     {
//       var postData = 'userData='+JSON.stringify(formData);
//       var request = $http({
//          method: "post",
//          url: mServerAPI + "/users",
//          crossDomain : true,
//          data: postData,
//          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
//          cache: false
//       });

//       /* Successful HTTP post request or not */
//       request.success(function(data) {
//         alert('success');
//         window.localStorage['name'] =  results.data.name;
//         window.localStorage['picture'] = results.data.picture.data.url;
//         $state.go("tabs.home");
//       })
//       .error(function(){
//         alert('error');
//       });

//     }
// }]);
