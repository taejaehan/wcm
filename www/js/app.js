var mServerUrl, mServerUpload, mServerAPI = '';
var mLocalServer = false; //local serve 여부

if (mLocalServer) {
  mServerUrl = 'http://192.168.10.105:3000';
  mServerUpload = mServerUrl + '/uploads/';
  mServerAPI = mServerUrl + '/index.php';
} else {
  mServerUrl = 'https://wcm.major-apps-1.com';
  mServerUpload = mServerUrl + '/uploads/';
  mServerAPI = mServerUrl + '/index.php';
}

//연결된 device에 대한 정보 (boolean)
var mIsWebView = ionic.Platform.isWebView(); 
var mIsIOS = ionic.Platform.isIOS();
var mIsAndroid = ionic.Platform.isAndroid();

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

var wcm = angular.module('wcm', ['ionic', 'ngCordova', 'ng']);


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
    console.log('filter items : ' + items);
    if(items !=null){
      return items.slice().reverse();
    };
  };
});

wcm.run(function($ionicPlatform, $http, $cordovaFile) {
  // Kakao.init('2b1444fba3c133df8405882491640b80');

  

  $ionicPlatform.ready(function() {
    window.localStorage.clear();
    // window.localStorage['user'] = null;

    var request = $http({
        method: "get",
        url: mServerAPI + "/cards",
        crossDomain : true,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
        cache: false
    });

    request.success(function(data) {
      window.localStorage['cardList'] = JSON.stringify(data);
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


