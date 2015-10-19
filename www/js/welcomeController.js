wcm.controller("WelcomeController", function($scope, $state, $http ,$cordovaOauth, AuthService, $window, $cordovaPreferences, $ionicLoading) {

  console.log('user : ' + window.localStorage['user']);

  $scope.facebookLogin = function(){

    //webview 앱에서 실행했을 때만 facebook login
    if(mIsWebView){

      $ionicLoading.show({
        template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Login'
      });

      $cordovaOauth.facebook("1020667507964480", ["public_profile"], {redirect_uri: "http://localhost/"}).then(function(result){
            $http.get("https://graph.facebook.com/v2.2/me", {params: {access_token: result.access_token, fields: "name,picture", format: "json" }}).then(function(results) {

                $ionicLoading.hide();
                //url 중에 "&"은 "amp;"로 치환해야 에러가 나지 않는다
                var formData = {
                                 user_id: results.data.id,
                                 username: results.data.name,
                                 userimage: results.data.picture.data.url.split("&").join("amp;"),
                                 sns: "fb"
                               };

                $scope.userLogin(formData);

                // $rootScope.$emit('loginSuccess');
                // window.state.go('tabs.home');
            }, function(error) {
                $ionicLoading.hide();
                alert("Error: " + JSON.stringify(error));
            });
      },  function(error){
            $ionicLoading.hide();
            alert("Error: " + JSON.stringify(error));
      });
    } else {  //app에서 실행한게 아니면 테스트용도로 넣어줌 

      //url 중에 "&"은 "amp;"로 치환해야 에러가 나지 않는다
      var userImage =  "https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/c15.0.50.50/p50x50/10354686_10150004552801856_220367501106153455_n.jpg?oh=17835c9c962c70d05cc25d75008438a3&oe=5698842F&__gda__=1452879355_4d8b6c5947a3a8359645aff176f54967".split("&").join("amp;");
      var formData = {
                         user_id: "1826451354247937",
                         username: "Dev Major",
                         userimage: userImage,
                         sns: "fb",
                       };
      $scope.userLogin(formData);
    }
  }


  $scope.skipLogin =function() {
    AuthService.skipLogin();
  }

  /*
  * 해당 user_id가 db에 없으면 넣고, 있으면 해당 user 정보를 가져온다
  * @param : formData {user_id:'', username:'',userimage:'',sns:''}
  */
  $scope.userLogin = function(formData)
  {
    var userData = 'userData='+JSON.stringify(formData);
    
    var request = $http({
       method: "post",
       url: mServerAPI + "/user",
       crossDomain : true,
       data: userData,
       headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
       cache: false
    });

    request.success(function(data) {

      /* user data 넣어주기 시작 */
      var user = {
                    username: formData.username,
                    userid: formData.user_id,
                    userimage: formData.userimage.split("amp;").join("&"),
                    isAuthenticated: true,
                    likes : [],
                    changes : []
                  };
      //로그인 했었던 유저라면(db에 user_id가 있다면) watch와 change를 push
      if(data.users != null){
        console.log('Existent User : ' + data.users[0].username);
        if (data.users[0].likes.length != 0) {
          for(var i = 0; i < data.users[0].likes.length; i++ ) {
            user.likes.push(data.users[0].likes[i].post_id); 
          }
        }
        if (data.users[0].changes.length != 0) {
          for(var i = 0; i < data.users[0].changes.length; i++ ) {
            user.changes.push(data.users[0].changes[i].post_id); 
          }
        }
      }else{  //새로 가입한 유저라면
        console.log('New User : ' + formData.username);
      }
      window.localStorage['user'] = JSON.stringify(user);
      /* user data 넣어주기 끝 */

      //overlay창 닫기
      if(document.getElementById('welcomeOverlay') != null){
        document.getElementById('welcomeOverlay').setAttribute('style','display:none');
      }

      //com.portnou.cordova.plugin.preferences plugin에서 앱의 prefrences에 저장
      if(mIsWebView){

          console.log('welcomController typeof Preferences != undefined : ' + (typeof Preferences != 'undefined'));
          //로그인 후 무조건 다시보지 않기
          Preferences.put('notShowPref', true); 

          Preferences.get('loginId', function(loginId) {
            console.log('success before: : ' +  loginId);
          }, function(error){
            console.log('error: : ' +  error);
          });

          //로그인 아이디 저장
          Preferences.put('loginId', formData.user_id);

          Preferences.get('loginId', function(loginId) {
           console.log('success after: : ' +  loginId);
          }, function(error){
            console.log('error: : ' +  error);
          });
      }

      $state.go("tabs.home");

    })
    .error(function(error){
      alert('ERROR : '+JSON.stringify(error));
    });

  }

});
