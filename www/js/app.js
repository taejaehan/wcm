var mAppName = "'WeChangeMakers'";
var mServerUrl, mServerUpload, mServerAPI = '';
var mLocalServer = false; //local serve 여부

if (mLocalServer) {
  mServerUrl = 'http://192.168.20.8:3000';
  mServerUpload = mServerUrl + '/uploads/';
  mServerUploadThumb = mServerUrl + '/uploads/thumb/';
  mServerAPI = mServerUrl + '/index.php';
} else {
  mServerUrl = 'https://wcm.major-apps-1.com';
  mServerUpload = mServerUrl + '/uploads/';
  mServerUploadThumb = mServerUrl + '/uploads/thumb/';
  mServerAPI = mServerUrl + '/index.php';
}

//push 보낼 때 사용하는 app정보
var mAppId = "e02f6eed";
var mPrivateKey = 'dd9f336bb59a9b792d398d719e464b264020bb07c61f8b7b';

//facebook share및 invite에서 사용하는 정보
var mFacebookUrl = 'https://fb.me/1063872636977300/';

//연결된 device에 대한 정보 (boolean)
var mIsWebView, mIsIOS,  mIsAndroid, mDeviceUuid;

//사진이 없을 경우 보여주는 이미지 링크
var mNoImage = 'img/default.png';
var mNoImageThumb = 'img/default_thumb.png';

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
var PROGRESS_START_TEXT = "위험요소가 등록되었습니다";
var PROGRESS_ONGOING_TEXT = "위험요소가 해결되고 있습니다";
var PROGRESS_COMPLETED_TEXT = "위험요소가 해결되었습니다";

//부적절한 글로 신고된 갯수로 로그인을 금지 할 때 사용
var BAD_REPORT_LOGIN_LIMIT = 5;

var wcm = angular.module('wcm', ['ionic', 'ngCordova', 'ng', 'pasvaz.bindonce', 'ngTouch'])

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

wcm.run(function($ionicPlatform, $http, $cordovaFile, $ionicLoading, $ionicPopup, $rootScope) {

  console.log('wcm RUN');
  //$ionicPlatform이 ready되면 연결된 device에 대한 정보를 저장 (boolean)
  mIsWebView = ionic.Platform.isWebView();
  mIsIOS = ionic.Platform.isIOS();
  mIsAndroid = ionic.Platform.isAndroid();

  $ionicPlatform.ready(function() {

    console.log('$ionicPlatform ready');

    $ionicLoading.show({
      template: '<ion-spinner icon="bubbles"></ion-spinner><br/>초기화..'
    });

    window.localStorage.clear();

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

    /************************************background location 시작 ************************************************/

    // Your app must execute AT LEAST ONE call for the current position via standard Cordova geolocation,
    //  in order to prompt the user for Location permission.
    // window.navigator.geolocation.getCurrentPosition(function(location) {
    //     console.log('Location from Phonegap');
    // });
    // var bgGeo = window.plugins.backgroundGeoLocation;
 
    // /**
    // * This would be your own callback for Ajax-requests after POSTing background geolocation to your server.
    // */
    // var yourAjaxCallback = function(response) {
    //     ////
    //     // IMPORTANT:  You must execute the #finish method here to inform the native plugin that you're finished,
    //     //  and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
    //     // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
    //     //
    //     //
    //     bgGeo.finish();
    // };
 
    // /**
    // * This callback will be executed every time a geolocation is recorded in the background.
    // */
    // var callbackFn = function(location) {
    //     console.log('[js] BackgroundGeoLocation callback:  ' + location.latitude + ',' + location.longitude);
    //     // Do your HTTP request here to POST location to your server.
    //     //
    //     //
    //     yourAjaxCallback.call(this);
    // };
 
    // var failureFn = function(error) {
    //     console.log('BackgroundGeoLocation error');
    // }
 
    // // BackgroundGeoLocation is highly configurable.
    // bgGeo.configure(callbackFn, failureFn, {
    //     // url: 'http://only.for.android.com/update_location.json', // <-- Android ONLY:  your server url to send locations to
    //     url: mServerAPI + '/update_location',
    //     params: {
    //         // auth_token: 'user_secret_auth_token',    //  <-- Android ONLY:  HTTP POST params sent to your server when persisting locations.
    //         auth_token : 'APA91bEIyVng8OXg6jOV_71RIzoB96FISaXEHazagcUPcw9x_jBHFZbtjXEL5mjt6vJ37WvBlrV9uXk4ATacTb8ftOMxDtISb9inYHk9KBI3p9jHPjLz6Nw',
    //         foo: 'bar'                              //  <-- Android ONLY:  HTTP POST params sent to your server when persisting locations.
    //     },
    //     headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    //     /*headers: {                                   // <-- Android ONLY:  Optional HTTP headers sent to your configured #url when persisting locations
    //         "X-Foo": "BAR"
    //     },*/
    //     desiredAccuracy: 10,
    //     stationaryRadius: 20,
    //     distanceFilter: 30,
    //     notificationTitle: 'Background tracking', // <-- android only, customize the title of the notification
    //     notificationText: 'ENABLED', // <-- android only, customize the text of the notification
    //     activityType: 'AutomotiveNavigation',
    //     debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
    //     stopOnTerminate: false // <-- enable this to clear background location settings when the app terminates
    // });
 
    // // Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app.
    // bgGeo.start();
 
    // If you wish to turn OFF background-tracking, call the #stop method.
    // bgGeo.stop()
    /************************************background location 끝 ************************************************/



    //로그인 한 상태라면 prefresnces에 저장된 user id로 서버에서 유저 정보를 가져와 localStorage에 저장
    var saveLocalUser = function(loginId) {
      if(loginId != null){
        var request = $http({
           method: "get",
           url: mServerAPI + "/user/" + loginId,
           crossDomain : true,
           headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
           cache: false
        });

        request.success(function(data) {
          $ionicLoading.hide();
          console.log('************5.Login Success************');
          console.log('success data : ' + JSON.stringify(data));

          if(parseInt(data.users[0].bad_report) > BAD_REPORT_LOGIN_LIMIT){
            if(mIsWebView){
              //prefrences 초기화
              Preferences.put('loginId', '');
            }
            //경고alert
            $ionicPopup.alert({
              title: mAppName,
              template: '당신의 게시물이 신고되어 현재 아이디로 로그인 하지 못합니다. 이의가 있을 시 wechangemakers@gamil.com으로 메일을 보내주세요',
              cssClass: 'wcm-error',
            });  
            return;
          } 
          var user = {
            username: data.users[0].username,
            userid: data.users[0].user_id,
            userimage: data.users[0].userimage.split("amp;").join("&"),
            isAuthenticated: true,
            watchs : [],
            changes : [],
          };

          //user watch list저장
          if (data.users[0].watchs.length > 0) {
            for(var i = 0; i < data.users[0].watchs.length; i++ ) {
              user.watchs.push(data.users[0].watchs[i].post_id);
            }
          }

          //user changer list저장
          if (data.users[0].changes.length > 0) {
            for(var i = 0; i < data.users[0].changes.length; i++ ) {
              user.changes.push(data.users[0].changes[i].post_id);
            }
          }

          window.localStorage['user'] = JSON.stringify(user);
        });
      }
    };

    if(mIsWebView){
      /******************************************************************************
      * IONIC PUSH를 위한 SETTING by tjhan 151023
      * prefrences에 deviceUuid가 있다면 해당 device는 ionic user와 wcm db에
      * (device uuid와 해당 device의 token이) 등록되어 있고 push가 가능한 상태이다
      * prefrences에 없다면 새롭게 user와 device를 등록하는데
      * ionic user에 해당 device uuid가 이미 있다면(깔았다가 지웠다면)
      * 새롭게 등록하지 않고 해당 ionic user와 wcm db의 token을 수정한다
      ******************************************************************************/

      /*
      * ionic.Platform.device().uuid가 android에서는 유지되나 ios에서 매번 변경되어
      * window.plugins.uniqueDeviceID 플러그인으로 교체
      */
      window.plugins.uniqueDeviceID.get(success, fail);
      function success(uuid)
      {
          console.log('ionic.Platform.device().uuid : ' + ionic.Platform.device().uuid);
          console.error('uniqueDeviceID success uuid : ' + uuid);
          mDeviceUuid = uuid;
      };
      function fail()
      {
          console.error('uuid fail');
      };

      // //웹 앱에서 facebookConnectPlugin를 사용하기 위해 facebook app id를 init한다
      // facebookConnectPlugin.browserInit('1020667507964480');

      var tryNum = 0;
      var tryRegisterAndLogin = function(){

        console.log('tryRegisterAndLogin Preferences OK');

        if(typeof Preferences != 'undefined'){

          //prefrences에 deviceUuid 체크
          Preferences.get('deviceUuid', function(deviceUuid) {
            console.log('success : ' +  deviceUuid);
            console.log('deviceUuid == "" : ' +  (deviceUuid == ''));
            console.log('deviceUuid == null : ' +  (deviceUuid == null));

            //deviceUuid에 값이 있다면 push 받을 수 있는 device
            if(deviceUuid == '' || deviceUuid == null){
              console.log('************0.Start device register************');
              /*****************************************************************************
              *********************** user추가 및 push 등록 시작    **********************
              *****************************************************************************/
              console.log('ionic.Platform.device() : ' + ionic.Platform.device());
              console.log('ionic.Platform.device().uuid : ' + ionic.Platform.device().uuid);

              if(Ionic != null){
                console.log('Ionic OK');
                Ionic.io();
              }else{
                console.log('Ionic NO');
                $ionicLoading.hide();
              }

              /*************************push************************/
              /********아래쪽 user를 load한 후 실행한다**********/
              var push = new Ionic.Push({
                //debug false이면 폰에서만 동작
                "debug": false,
                "pluginConfig": {
                  "ios": {
                    "badge": true,
                    "sound": true
                   },
                   "android": {
                     "iconColor": "#343434"
                   }
                },
                // notification왔을 때 alert 주석처리 by tjhan 151112
                /*"onNotification": function(notification) {
                  var payload = notification.payload;
                  console.log('notification : ' + notification);
                  console.log('payload : ' + notification.payload);
                  console.log('title : ' + notification.title);
                  $ionicPopup.alert({
                    title: mAppName,
                    template: payload.message,
                    cssClass: 'wcm-negative'
                  });
                },*/
                //push가 등록되면 해당 push token을 위에 설정한 user에 넣고 db에도 넣는다
                "onRegister": function(data) {
                  console.log('************2.onRegister token************ : ' + data.token);

                  //해당 push token을 ionic user에 등록하고 저장
                  push.addTokenToUser(user);
                  user.save().then(function(response) {
                    console.log('************2.user addTokenToUser was saved************');

                    /*wcm DB에 저장*/
                    var formData = {
                          device_uuid: mDeviceUuid,
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
                      $ionicLoading.hide();
                      console.log('************3.Saving data FAIL at WCM database************');
                      console.log('error : ' + JSON.stringify(error));
                    })
                    request.success(function(data) {
                      console.log('************3.Saving data SUCCESS at WCM database************');
                      //로그인 아이디 Prefrences에 저장
                      if(typeof Preferences != 'undefined'){
                        Preferences.put('deviceUuid', mDeviceUuid);
                        console.log('************4.Device uuid is saved at Preferences************');
                      }
                      $ionicLoading.hide();
                    });
                  }, function(error) {
                    $ionicLoading.hide();
                    console.log('************2.user addTokenToUser was NOT saved************');
                  });
                }
              });

              /*************user************/
              //현재 device uuid로 등록된 user가 있다면 load하고 없다면 새로 추가한다
              var user = Ionic.User.current();
              Ionic.User.load(mDeviceUuid).then(function(success) {
                //이미 유저가 있으면(해당 디바이스의 uuid가 등록되어 있다면) 해당 유저 load
                console.log('************1.loadedUser user is registered Already************');
                Ionic.User.current(success);
                user = Ionic.User.current();

                push.register();
              }, function(error) {
                 //유저가 없다면(등록되어 있지 않다면)
                console.log('************1.loadedUser No registered User************ : ' + JSON.stringify(error));


                if (!user.id) {
                  // user.id = Ionic.User.anonymousId();
                  //ionic플랫폼에 저장되는 user id로 device uuid를 사용한다 by tjhna 151022
                  console.log('deviceUuid : ' + mDeviceUuid);
                  user.id = mDeviceUuid;
                }
                //새로운 user를 등록한다
                user.save().then(function(success) {
                  console.log('************1.New user was saved************');
                  push.register();
                }, function(error) {
                  $ionicLoading.hide();
                  console.log('************1.New user was NOT saved************');
                });
              });
              /*****************************************************************************
              *********************** user추가 및 push 등록 끝  *************************
              *****************************************************************************/

            }else{
              $ionicLoading.hide();
              console.log('************0.device uuid : ' + deviceUuid + ' is registered************');
            }
          }, function(error){
            $ionicLoading.hide();
            console.log('get deviceUuid error: : ' +  error);
          }); //Preferences.get('deviceUuid', function(deviceUuid) 끝


          /*
          *로그인 한 상태라면 prefresnces에 저장된 user id로 서버에서 유저 정보를 가져와 localStorage에 저장
          */
          Preferences.get('loginId', function(loginId) {
            console.log('tryRegisterAndLogin loginId : ' + loginId);
            if(loginId != null && loginId != ''){
              saveLocalUser(loginId);
            }
          }, function(error){
            console.log('error: : ' +  error);
          });

        }else{

          console.log('tryRegisterAndLogin Preferences NO : ' + tryNum);
          //Preferences를 찾아서 3번 시도한다
          if(tryNum < 4 ){
            $timeout( function() {
              tryLogin();
              tryNum++;
            }, 1000);
          }
        } // if(typeof Preferences != 'undefined') 끝
      } // tryRegisterAndLogin function 끝

      tryRegisterAndLogin();
    }else{
      saveLocalUser(1826451354247937);
      $ionicLoading.hide();
    } // if(mIsWebView) 끝
  }); //$ionicPlatform.ready 끝
})//wcm.run 끝

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
  //toggle버튼 통일
  $ionicConfigProvider.form.toggle('large').checkbox('circle');
  //ios에서 swipe하여 back 하는 기능 false
  $ionicConfigProvider.views.swipeBackEnabled(false);

  $stateProvider
  .state("tabs.fblogin", {
      url: "/profile/fblogin",
      views: {
        'profile-tab': {
        templateUrl: "templates/welcome.html",
        controller: "WelcomeController"
        }
      }
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
    .state('tabs.edit', {   //home에서 card edit을 눌러서 가는 view(home-tab 사용 edit by tjhan 151102)
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
    .state('tabs.about_us', {
      url: "/profile/config/about_us",
      views: {
        'profile-tab': {
          templateUrl: "templates/aboutUs.html",
          controller: 'ProfileController'
        }
      }
    })

    // $urlRouterProvider.otherwise("/fblogin");
    $urlRouterProvider.otherwise("/tab/home");

});

/*
* post를 Object로 보낼 때 사용
*/
Object.toparams = function ObjecttoParams(obj)
{
  var p = [];
  for (var key in obj)
  {
    p.push(key + '=' + encodeURIComponent(obj[key]));
  }
  return p.join('&');
};

/*
* facebook에서 link를 눌러 들어왔을 때 호출됩니다
*/
function handleOpenURL(url) {
  console.log('appjs handleOpenURL url : ' + url);

  setTimeout(function() {
    // alert("received url: " + url);
    var postId = url.split("post")[1];
    if(postId != null) {
      window.location.href = '#/tab/home/' + postId;
    }
    console.log('postId : ' + postId);
  }, 10);
};
