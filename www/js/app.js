var mServerUrl = 'http://192.168.20.45:3000/wcm_php';
var mServerAPI = mServerUrl + '/controllers/index.php';
// var mServerUrl = 'http://wcm.localhost';
// var mServerAPI = mServerUrl + '';

var wcm = angular.module('starter', ['ionic', 'ngCordova']);

wcm.run(function($ionicPlatform, $http) {
  // Kakao.init('2b1444fba3c133df8405882491640b80');

  $ionicPlatform.ready(function() {

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

wcm.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state("login", {
      url: "/login",
        templateUrl: "templates/login.html",
        controller: "LoginController"
    })
    .state('tabs', {
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html"
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
    .state('tabs.map', {
      url: "/home/map",
      views: {
        'home-tab': {
          templateUrl: "templates/warningMap.html",
          controller: 'WarningMapController'
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
    .state('tabs.edit', {
      url: "/home/:id/edit",
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
    .state('tabs.locationh', {
      url: "/location/:latlng",
      views: {
        'home-tab': {
          templateUrl: "templates/location.html",
          controller: 'MapController'
        }
      }
    })
    .state('tabs.locationw', {
      url: "/location/:latlng",
      views: {
        'write-tab': {
          templateUrl: "templates/location.html",
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

    $urlRouterProvider.otherwise("/tab/home");
   // $urlRouterProvider.otherwise("/login");
});

