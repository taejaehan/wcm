var mServerUrl, mServerUpload, mServerAPI = '';
var mLocalServer = false; //local serve 여부

if (mLocalServer) {
  mServerUrl = 'http://192.168.20.8:3000';
  mServerUpload = mServerUrl + '/uploads/';
  mServerAPI = mServerUrl + '/index.php';
} else {
  mServerUrl = 'https://wcm.major-apps-1.com';
  mServerUpload = mServerUrl + '/uploads/';
  mServerAPI = mServerUrl + '/index.php';
}

//연결된 device에 대한 정보 (boolean)
var mIsWebView, mIsIOS,  mIsAndroid;

//사진이 없을 경우 보여주는 이미지 링크
var mNoImage = 'img/default.png';

/*map의 marker type*/
var DISCOVERED  = 0;
var ONGOING     = 1;
var COMPLETED  = 2;
var DISCOVERED_TEXT  = "해결이 필요한 위험";
var ONGOING_TEXT  = "해결중 위험";
var COMPLETED_TEXT  = "해결 완료된 위험";

/*카드 진행상태 타입*/
var PROGRESS_REGISTER = "0";
var PROGRESS_START = "33";
var PROGRESS_ONGOING = "66";
var PROGRESS_COMPLETED = "100";
var PROGRESS_START_TEXT = "위험요소가 등록되었습니다.";
var PROGRESS_ONGOING_TEXT = "위험요소를 해결 중 입니다.";
var PROGRESS_COMPLETED_TEXT = "위험요소가 해결 되었습니다.";

var wcm = angular.module('wcm', ['ionic','ionic.service.core', 'ngCordova', 'ng', 'ionic.service.push'])

//controller간 데이터를 전달하기 위해 사용한다
wcm.factory('Scopes', function($rootScope) {
    var mem = {};
    return {
      store: function(key, value) {
         mem[key] = value;
      },
         get: function(key) {
         return mem[key];
      }
    };
})

/*filter가 뭔지 모르겠으나 items가 없을 경우 에러나서 예외처리함 by tjhan 151016*/
wcm.filter('reverse', function() {
  return function(items) {
    if(items !=null){
      return items.slice().reverse();
    };
  };
});

wcm.run(function($ionicPlatform, $http, $cordovaFile, $ionicLoading, $ionicPush) {

  console.log('wcm RUN');
  $ionicPlatform.ready(function() {

    //$ionicPlatform이 ready되면 연결된 device에 대한 정보를 저장 (boolean)
    mIsWebView = ionic.Platform.isWebView(); 
    mIsIOS = ionic.Platform.isIOS();
    mIsAndroid = ionic.Platform.isAndroid();

    if(mIsWebView){
      /*
      * IONIC PUSH를 위한 SETTING by tjhan 151022
      * prefrences에 deviceUuid가 있다면 해당 device는 ionic user와 wcm db에 
      * (device uuid와 해당 device의 token이) 등록되어 있고 push가 가능한 상태이다
      * prefrences에 없다면 새롭게 user와 device를 등록하는데
      * ionic user에 해당 device uuid가 이미 있다면(깔았다가 지웠다면) 
      * 새롭게 등록하지 않고 해당 ionic user와 wcm db의 token을 수정한다
      */
      var tryNum = 0;

      var tryDeviceRegister = function(){
        
        console.log('tryDeviceRegister Preferences OK');

        if(typeof Preferences != 'undefined'){
          //prefrences에 deviceUuid가 없을 경우에만 실행
          Preferences.get('deviceUuid', function(deviceUuid) {
            console.log('success : ' +  deviceUuid);
            console.log('deviceUuid == "" : ' +  (deviceUuid == ''));
            console.log('deviceUuid == null : ' +  (deviceUuid == null));

            if(deviceUuid == '' || deviceUuid == null){
              console.log('************0.Start device register************');
              /*********************************
              * user추가 및 push 등록 시작
              *********************************/
              console.log('ionic.Platform.device() : ' + ionic.Platform.device());
              console.log('ionic.Platform.device().uuid : ' + ionic.Platform.device().uuid);
              //ionic플랫폼에 저장되는 user id로 device uuid를 사용한다 by tjhna 151022
              var deviceUuid = ionic.Platform.device().uuid;

              Ionic.io();
              /*************user************/
              //현재 device uuid로 등록된 user가 있다면 load하고 없다면 새로 추가한다
              var user = Ionic.User.current();
              Ionic.User.load(deviceUuid).then(function(success) {
                //이미 유저가 있으면(해당 디바이스의 uuid가 등록되어 있다면) 해당 유저 load
                console.log('************1.loadedUser user is registered Already************');
                Ionic.User.current(success);
                user = Ionic.User.current();
              }, function(error) {
                 //유저가 없다면(등록되어 있지 않다면) 
                console.log('************1.loadedUser No registered User************ : ' + JSON.stringify(error));

                if (!user.id) {
                  // user.id = Ionic.User.anonymousId();
                  console.log('deviceUuid : ' + deviceUuid);
                  user.id = deviceUuid;
                }
                //새로운 user를 등록한다
                user.save().then(function(success) {
                  console.log('************1.New user was saved************');
                }, function(error) {
                  console.log('************1.New user was NOT saved************');
                });
              });

              /*************push************/
              var push = new Ionic.Push({
                //debug false이면 폰에서만 동작
                "debug": false,
                //push가 오면
                "onNotification": function(notification) {
                  var payload = notification.payload;
                  alert('onNotification : ' + notification, payload);
                },
                //push가 등록되면 해당 push token을 위에 설정한 user에 넣고 db에도 넣는다
                "onRegister": function(data) {
                  console.log('************2.onRegister token************ : ' + data.token);
                  
                  //해당 push token을 ionic user에 등록하고 저장
                  push.addTokenToUser(user);
                  user.save().then(function(response) {
                    console.log('************2.user addTokenToUser was saved************');
                  }, function(error) {
                    console.log('************2.user addTokenToUser was NOT saved************');
                  });

                  var formData = { 
                        device_uuid: deviceUuid,
                        device_token: data.token
                      };
                  var postData = 'deviceData='+JSON.stringify(formData);

                  var request = $http({
                      method: "post",
                      url: mServerAPI + "/device",
                      crossDomain : true,
                      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
                      data: postData,
                      cache: false
                  });
                  request.error(function(error){
                    console.log('************3.Saving data FAIL at WCM database************');
                    console.log('error : ' + JSON.stringify(error));
                  })
                  request.success(function(data) {
                    console.log('************3.Saving data SUCCESS at WCM database************');
                  });

                  if(typeof Preferences != 'undefined'){
                    //로그인 아이디 저장
                    Preferences.put('deviceUuid', deviceUuid);
                    console.log('************4.Device uuid is saved at Preferences************');
                  }

                },
                "pluginConfig": {
                  "ios": {
                    "badge": true,
                    "sound": true
                   },
                   "android": {
                     "iconColor": "#343434"
                   }
                }
              });
              push.register();
              /*********************************
              * user추가 및 push 등록 끝
              *********************************/
            }else{
               console.log('************0.device uuid : ' + deviceUuid + ' is registered************');
            }
          }, function(error){
            console.log('get deviceUuid error: : ' +  error);
          }); //Preferences.get('deviceUuid', function(deviceUuid) 끝
        }else{
          console.log('Preferences NO : ' + tryNum);
          //Preferences를 찾아서 3번 시도한다
          if(tryNum < 4 ){
            $timeout( function() {
              tryLogin();
              tryNum++;
            }, 1000);
          }
        } // if(typeof Preferences != 'undefined') 끝
      } // tryDeviceRegister function 끝

      tryDeviceRegister();
    } // if(mIsWebView) 끝

    window.localStorage.clear();
    // window.localStorage['user'] = null;

    $ionicLoading.show({
      template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Loading..'
    });

    var request = $http({
        method: "get",
        url: mServerAPI + "/cards",
        crossDomain : true,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
        cache: false
    });

    request.success(function(data) {
      $ionicLoading.hide();
      window.localStorage['cardList'] = JSON.stringify(data);
    });
    request.error(function(error){
      $ionicLoading.hide();
      console.log('error : ' + JSON.stringify(error))
    });

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      //세로 고정 (cordova-plugin-screen-orientation 플러그인 사용)
      screen.lockOrientation('portrait');
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

  });
})

// to solve ios9 <Error: $rootScope:infdig Infinite $digest Loop> problem
wcm.config(['$provide', function($provide) {
  'use strict';

  $provide.decorator('$browser', ['$delegate', '$window', function($delegate, $window) {

    if (isIOS9UIWebView($window.navigator.userAgent)) {
      return applyIOS9Shim($delegate);
    }

    return $delegate;

    function isIOS9UIWebView(userAgent) {
      return /(iPhone|iPad|iPod).* OS 9_\d/.test(userAgent) && !/Version\/9\./.test(userAgent);
    }

    function applyIOS9Shim(browser) {
      var pendingLocationUrl = null;
      var originalUrlFn= browser.url;

      browser.url = function() {
        if (arguments.length) {
          pendingLocationUrl = arguments[0];
          return originalUrlFn.apply(browser, arguments);
        }

        return pendingLocationUrl || originalUrlFn.apply(browser, arguments);
      };

      window.addEventListener('popstate', clearPendingLocationUrl, false);
      window.addEventListener('hashchange', clearPendingLocationUrl, false);

      function clearPendingLocationUrl() {
        pendingLocationUrl = null;
      }

      return browser;
    }
  }]);
}]);


wcm.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

  $ionicConfigProvider.tabs.position('bottom');
  $ionicConfigProvider.navBar.alignTitle('center');
  $ionicConfigProvider.views.maxCache(0);
  
  $stateProvider
  .state("fblogin", {
      url: "/fblogin",
        templateUrl: "templates/welcome.html",
        controller: "WelcomeController"
    })
    .state('tabs', {
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html",
      controller: 'TabController'
    })
    .state('tabs.home', {
      url: "/home",
      views: {
        'home-tab': {
          templateUrl: "templates/home.html",
          controller: 'HomeController'
        }
      }
    })
    .state("tabs.post_h", {
      url: "/home/:postId",
      views: {
        'home-tab': {
          templateUrl: "templates/post.html",
          controller: 'PostController'
        }
      }
    })
    .state("tabs.post_p", {   //profile에서 접근하는 post view추가 by tjhan 151016
      url: "/profile/:postId",
      views: {
        'profile-tab': {
          templateUrl: "templates/post.html",
          controller: 'PostController'
        }
      }
    })
    .state('tabs.map', {
      url: "/home/map",
      views: {
        'home-tab': {
          templateUrl: "templates/warningMap.html",
          controller: 'WarningMapController'
        }
      }
    })
    .state('tabs.edit', {
      url: "/home/edit/:id/",
      views: {
        'home-tab': {
          templateUrl: "templates/write.html",
          controller : "WriteController"
        }
      }
    })
    .state('tabs.write', {
      url: "/write",
      views: {
        'write-tab': {
          templateUrl: "templates/write.html",
          controller : "WriteController"
        }
      }
    })
    .state('tabs.location_h', {
      url: "/location/:latlng/:progress",
      views: {
        'home-tab': {
          templateUrl: "templates/map.html",
          controller: 'MapController'
        }
      }
    })
    .state('tabs.location_w', {
      url: "/location/:latlng",
      views: {
        'write-tab': {
          templateUrl: "templates/map.html",
          controller: 'MapController'
        }
      }
    })
    .state('tabs.profile', {
      url: "/profile",
      views: {
        'profile-tab': {
          templateUrl: "templates/profile.html",
          controller: 'ProfileController'
        }
      }
    })
    .state('tabs.editProfile', {
      url: "/profile/edit",
      views: {
        'profile-tab': {
          templateUrl: "templates/editprofile.html",
          controller: 'ProfileController'
        }
      }
    })
    .state('tabs.config', {
      url: "/profile/config",
      views: {
        'profile-tab': {
          templateUrl: "templates/configuration.html",
          controller: 'ProfileController'
        }
      }
    })
    .state('tabs.terms', {
      url: "/profile/config/terms",
      views: {
        'profile-tab': {
          templateUrl: "templates/terms.html",
          controller: 'ProfileController'
        }
      }
    })
    .state('tabs.terms_gps', {
      url: "/profile/config/terms_gps",
      views: {
        'profile-tab': {
          templateUrl: "templates/terms-gps.html",
          controller: 'ProfileController'
        }
      }
    })
    .state('tabs.privacy', {
      url: "/profile/config/privacy",
      views: {
        'profile-tab': {
          templateUrl: "templates/privacy.html",
          controller: 'ProfileController'
        }
      }
    })

    // $urlRouterProvider.otherwise("/fblogin");
    $urlRouterProvider.otherwise("/tab/home");

});


