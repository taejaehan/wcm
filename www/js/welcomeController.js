wcm.controller("WelcomeController", function($scope, $state, $http ,$cordovaOauth, AuthService, $window, $cordovaPreferences, $ionicLoading, $ionicPopup, $timeout) {

  console.log('user : ' + window.localStorage['user']);
  $scope.signupTab = true;
  $scope.loginTab = false;
  $scope.data = {};

  $scope.showLoginTab = function() {
    $scope.loginTab = true;
    $scope.signupTab = false;
    $scope.data = {};
  }

  $scope.showSignupTab = function() {
    $scope.loginTab = false;
    $scope.signupTab = true;
    $scope.data = {};
  }
  $scope.facebookLogin = function(){
    console.log('facebookLogin');
    AuthService.login('facebook');
  }
  $scope.showEmailPage = function(){
    $state.go("tabs.emaillogin");
  }
  $scope.emailLogin = function(form, type){
   if(!(form.$valid) || (type == 'emailSignup' && $scope.data.password != $scope.data.password2)){
     var confirmPopup = $ionicPopup.alert({
        title: mAppName,
        template: '형식에 맞게 입력해주세요. </br> 이메일은 you@domain.com 형식으로, </br> 사용자 이름 3자 이상,  비밀번호 7자 이상, </br> 비밀번호와 비밀번호확인은 같아야 합니다',
        cssClass: 'wcm-negative',
      });
      return;
    }else{
      AuthService.login(type, $scope.data);
    }
  }
  $scope.skipLogin =function() {
    AuthService.skipLogin();
  }
  
  $scope.terms = function() {
    $state.go("tabs.terms");
  }

  $scope.termsGps = function() {
    $state.go("tabs.terms_gps");
  }

  $scope.privacy = function() {
    $state.go("tabs.privacy");
  }
});
