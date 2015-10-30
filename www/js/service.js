wcm.service('AuthService', function($state, $ionicPopup, $http, $window, $ionicLoading) {
  
  var login = function(name, pw) {

    if (name == 'admin' && pw == 'dmajor1196') {
      var user = {
                    username: name,
                    userid: 1,
                    userimage: "http://mud-kage.kakao.co.kr/14/dn/btqchdUZIl1/FYku2ixAIgvL1O50eDzaCk/o.jpg",
                    isAuthenticated: true
                  };
      
      window.localStorage['user'] = user;

      var request1 = $http({
          method: "get",
          url: mServerAPI + "/like/" + user.userid,
          crossDomain : true,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          cache: false
      });

      var request2 = $http({
          method: "get",
          url: mServerAPI + "/change/" + user.userid,
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

          $state.go('tabs.home');
        });
      });   
  

    } else {
      $ionicPopup.alert({
        title: '로그인 실패',
        template: '인터넷에 연결 상태를 확인하세요'
      });
    }
  };

  /*
  * logout시에 facebook과 연결을 끊는다 by tjhan 151030
  */
  var logout = function() {

    $ionicLoading.show({
      template: '<ion-spinner icon="bubbles"></ion-spinner><br/>로그아웃..'
    });

    facebookConnectPlugin.logout(function (success) {
      $ionicLoading.hide();
      console.log("logout success ");
      console.log("logout : ", success);
      isAuthenticated = false;
      window.localStorage.removeItem('user');
      $state.go('fblogin');
    },
    function loginError (error) {
      $ionicLoading.hide();
      console.log("logout error ");
      console.error("logout error : " + JSON.stringify(error));
      $ionicPopup.alert({
        title: 'We Change Makers',
        template: JSON.stringify(error)
      });
    });
   
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