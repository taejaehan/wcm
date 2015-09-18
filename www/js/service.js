wcm.service('AuthService', function($state, $ionicPopup) {
  
  // var login = function(name, pw) {

  //   if (name == 'admin' && pw == 'dmajor1196') {
  //     isAuthenticated = true;
  //     username = name;

  //     var user = {
  //                   username: name,
  //                   userpassword: pw,
  //                   isAuthenticated: true
  //                 };

  //     window.localStorage['user'] = JSON.stringify(user);
  //     var user = JSON.parse(window.localStorage['user']);
  //     console.log(user);
  //     $state.go('tabs.home');

  //   } else {
  //     $ionicPopup.alert({
  //       title: 'Login failed',
  //       template: 'Please check your credentials.'
  //     });
  //   }
  // };

  // var logout = function() {
  //   username = '';
  //   isAuthenticated = false;
  //   window.localStorage.removeItem('user');
  //   $state.go('login');
  // };


  var kakaoLogin = function(res) {
    res.isAuthenticated = true;
    window.localStorage['user'] = JSON.stringify(res);
    var user = JSON.parse(window.localStorage['user']);
    console.log(user);
  };


  var kakaoLogout = function() {
    Kakao.Auth.logout(function(result){
      if (result) {
        window.localStorage.removeItem('user');
        console.log(window.localStorage['user']);
        $state.go('login');
     };
   });
  }

  var skipLogin = function() {
    var user = { isAuthenticated: false };
    window.localStorage['user'] = JSON.stringify(user);
    $state.go('tabs.home');
  };


  return {
    kakaoLogin: kakaoLogin,
    kakaoLogout: kakaoLogout,
    skipLogin: skipLogin,
    username: function() {return username;},
  };

})