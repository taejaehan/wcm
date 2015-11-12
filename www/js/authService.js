wcm.service('AuthService', function($state, $ionicPopup, $http, $window, $ionicLoading, $location) {
  
  /*
  * 유저 로그인 합니다 
  * @param snsType (String) (ex : 'facebook')
  */
  var login = function(snsType) {
    //webview 앱에서 실행했을 때만 facebook login
    if(mIsWebView){

      $ionicLoading.show({
        template: '<ion-spinner icon="bubbles"></ion-spinner><br/>로그인..'
      });

      if(snsType == 'facebook'){
        /*
        * cordova-plugin-facebook4 플러그인을 이용하여 native앱으로 wcm앱을 인증받아 로그인한다 
        * 원래 로그인 성공시 userInfo가 와야하는데 오지 않아서 api를 호출하여 유저 정보를 가져온다
        * by tjhan 151030
        */
        facebookConnectPlugin.login(["public_profile", 'email', 'user_friends'], 
          function (userData) {
            console.log("login success ");
            console.log("UserInfo : "+ userData);
            console.log("UserInfo : "+ JSON.stringify(userData));

            facebookConnectPlugin.api(
              "/me", 
              ["public_profile", 'email', 'user_friends'], 
              function (UserInfo) {
                console.log("api success");
                console.log("api success : " + JSON.stringify(UserInfo));
                console.log("user id : " + UserInfo.id);
                console.log("user name : " + UserInfo.name);

                var formData = {
                                 user_id: String(UserInfo.id),
                                 username: UserInfo.name,
                                 userimage: 'https://graph.facebook.com/'+UserInfo.id+'/picture',
                                 sns: "fb",
                                 device_uuid : mDeviceUuid
                               };
                userLogin(formData);
              }, 
              function loginError (error) {
                $ionicLoading.hide();
                console.log("api error");
                console.log("api error : " + JSON.stringify(error));
                $ionicPopup.alert({
                  title: mAppName,
                  template: JSON.stringify(error),
                  cssClass: 'wcm-negative'
                });
              }
            );
          },
          function loginError (error) {
            $ionicLoading.hide();
            console.log("login error ");
            console.error("login error : " + JSON.stringify(error));
            $ionicPopup.alert({
              title: mAppName,
              template: JSON.stringify(error),
              cssClass: 'wcm-error'
            });
          }
        );

      } // if(snsType == 'facebook'){ 끝
    } else {  //app에서 실행한게 아니면 테스트용도로 넣어줌 

      var formData = {
                         user_id: "1826451354247937",
                         username: "Dev Major",
                         userimage: 'https://graph.facebook.com/1826451354247937/picture',
                         sns: "fb",
                         device_uuid : 'd874c9de-b9f6-ef80-3542-570596882578'
                       };
      userLogin(formData);
    }
  };

  /*
  * 해당 user_id가 db에 없으면 넣고, 있으면 해당 user 정보를 가져온다
  * @param : formData {user_id:'', username:'',userimage:'',sns:''}
  */
  var userLogin = function(formData)
  {
    console.log('userLogin formData : ' + formData.username);
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

      $ionicLoading.hide();
      /* user data 넣어주기 시작 */
      var user = {
                    username: formData.username,
                    userid: formData.user_id,
                    userimage: formData.userimage,
                    isAuthenticated: true,
                    watchs : [],
                    changes : []
                  };
      //로그인 했었던 유저라면(db에 user_id가 있다면) watch와 change를 push
      if(data.users != null){
        console.log('Existent User : ' + data.users[0].username);
        if (data.users[0].watchs.length != 0) {
          for(var i = 0; i < data.users[0].watchs.length; i++ ) {
            user.watchs.push(data.users[0].watchs[i].post_id); 
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

          if(Ionic != null){
            console.log('Ionic OK');
            Ionic.io();

            var user = Ionic.User.current();
            var saveUser = function(){
              user.set('name', formData.username);
              user.set('image', formData.userimage);
              user.save().then(function(success) {
                console.log("saveUser success: " + JSON.stringify(success));
              }, function(error) {
                console.log("saveUser Error: " + JSON.stringify(error));
              });
            };
            //facebook 로그인 후 ionic user를 수정한다
            Ionic.User.load(mDeviceUuid).then(function(success) {
              console.log('loadUser success : ' + JSON.stringify(success));
              Ionic.User.current(success);
              user = Ionic.User.current();
              saveUser();
            }, function(error) {
              if (!user.id) {
                console.log('loadUser error : ' + JSON.stringify(error));
                //ionic플랫폼에 저장되는 user id로 device uuid를 사용한다 by tjhan 151023
                console.log('deviceUuid : ' + mDeviceUuid);
                user.id = mDeviceUuid;
              }
              saveUser();
            });
          }else{
            console.log('Ionic NO');
            $ionicLoading.hide();
          }
      }

      $state.go("tabs.home");

    })
    .error(function(error){
      $ionicLoading.hide();
      console.log('ERROR : '+JSON.stringify(error));
      $ionicPopup.alert({
        title: mAppName,
        template: JSON.stringify(error),
        cssClass: 'wcm-error'
      });
    });
  }

  /*
  * logout시에 facebook과 연결을 끊는다 by tjhan 151030
  */
  var logout = function() {

    console.log('logout');
    if(mIsWebView){
      $ionicLoading.show({
        template: '<ion-spinner icon="bubbles"></ion-spinner><br/>로그아웃..'
      });
      facebookConnectPlugin.logout(function (success) {
        $ionicLoading.hide();
        console.log("logout success ");
        console.log("logout : ", success);
        isAuthenticated = false;
        window.localStorage.removeItem('user');
        // $state.go('fblogin');
      },
      function loginError (error) {
        $ionicLoading.hide();
        console.log("logout error ");
        console.error("logout error : " + JSON.stringify(error));
        $ionicPopup.alert({
          title: mAppName,
          template: JSON.stringify(error),
          cssClass: 'wcm-error'
        });
      });
    }else{    //web 테스트 용도
      console.log("web logout");
      isAuthenticated = false;
      window.localStorage.removeItem('user');
      // $state.go('fblogin');
    }
   
  };

  var skipLogin = function() {
    var user = { isAuthenticated: false };
    window.localStorage['user'] = JSON.stringify(user);
    $state.go('tabs.home', {}, { reload: true });
  };

  return {
    login: login,
    logout: logout,
    skipLogin: skipLogin
  };

})