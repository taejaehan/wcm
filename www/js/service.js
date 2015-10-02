wcm.service('AuthService', function($state, $ionicPopup, $http, $window) {
  
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
        title: 'Login failed',
        template: 'Please check your credentials.'
      });
    }
  };


  var logout = function() {
    isAuthenticated = false;
    window.localStorage.removeItem('user');
    $state.go('fblogin');
  };


  var skipLogin = function() {
    var user = { isAuthenticated: false };
    window.localStorage['user'] = JSON.stringify(user);
    $state.go('tabs.home', {}, { reload: true });
  };


  return {
    login: login,
    logout: logout,
    skipLogin: skipLogin,
    username: function() {return username;},
  };

})