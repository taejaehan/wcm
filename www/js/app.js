var mServerUrl, mServerUpload, mServerAPI = '';
var localServer = false;

if (localServer) {
  mServerUrl = 'http://192.168.10.105:3000';
  mServerUpload = mServerUrl + '/uploads/';
  mServerAPI = mServerUrl + '/index.php';
} else {
  mServerUrl = 'https://wcm.major-apps-1.com';
  mServerUpload = mServerUrl + '/uploads/';
  mServerAPI = mServerUrl + '/index.php';
}


//사진이 없을 경우 보여주는 이미지 링크
var mNoImage = 'img/default.png';

var wcm = angular.module('wcm', ['ionic', 'ngCordova']);

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

wcm.run(function($ionicPlatform, $http, $cordovaFile, $cordovaPreferences) {
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
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

  });
})



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
    .state("login", {
      url: "/login",
        templateUrl: "templates/login.html",
        controller: "LoginController"
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
    .state("tabs.post", {
      url: "/home/:postId",
      views: {
        'home-tab': {
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


// wcm.factory('$cordovaPreferences', ['$window', '$q', function ($window, $q) {

//   return {
//     set: function (key, value) {
//       var q = $q.defer();

//       $window.appgiraffe.plugins.applicationPreferences.set(key, value, function (result) {
//         q.resolve(result);
//       }, function (err) {
//         q.reject(err);
//       });

//       return q.promise;
//     },

//     get: function (key) {
//       var q = $q.defer();

//       $window.appgiraffe.plugins.applicationPreferences.get(key, function (value) {
//         q.resolve(value);
//       }, function (err) {
//         q.reject(err);
//       });

//       return q.promise;
//     }
//   };
// }]);

