wcm.controller("TabController", function($scope, $state, $ionicPopup) {
  
  $scope.userLoginCheck = function(tab) {
    var user = JSON.parse(window.localStorage['user'] || '{}');
    console.log('TabController user.isAuthenticated : ' + user.isAuthenticated);
    if (user.isAuthenticated === true) {
      if(tab == 'write'){
        $state.go("tabs.write");
      }else if(tab == 'profile'){
        $state.go("tabs.profile");
      }
    } else {
      var message;
      if(tab == 'write'){
        message = "로그인 후 글쓰기 기능을 이용하실수 있습니다.";
      }else if(tab == 'profile'){
        message = "로그인 후 프로필 기능을 이용하실수 있습니다.";
      }
      var myPopup = $ionicPopup.show({
        template: message,
        title: mAppName,
        cssClass: 'wcm-positive',
        buttons: [
          { text: '나중에하기' },
          {
            text: '<b>로그인하기</b>',
            type: 'button-positive',
            onTap: function(e) {
              $state.go("fblogin");
            }
          }
        ]
      });
    }
  }

});