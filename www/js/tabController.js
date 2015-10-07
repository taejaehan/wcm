wcm.controller("TabController", function($scope, $state, $ionicPopup) {

  var user = JSON.parse(window.localStorage['user'] || '{}');

  $scope.writeUserCheck = function() {
    if (user.isAuthenticated === true) {
      $state.go("tabs.write");
    } else {
      var myPopup = $ionicPopup.show({
        template: "페이스북으로 로그인 후 글쓰기 기능을 이용하실수 있습니다.",
        title: 'We Change Makers',
      
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