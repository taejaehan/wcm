// var mServerUrl = 'http://192.168.20.45:3000/wcm_php';
// var mServerAPI = mServerUrl + '/controllers/api.php';
var mServerUrl = 'http://wcm.localhost';
var mServerAPI = mServerUrl + '/index.php';

var wcm = angular.module('starter', ['ionic', 'ngCordova'])

wcm.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {


    console.log("$ionicPlatform ready");

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
    .state("tabs.post", {
      url: "/home/:postId",
      views: {
        'home-tab': {
          templateUrl: "templates/post.html",
          controller: 'PostController'
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
    .state('tabs.location', {
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
          templateUrl: "templates/profile.html"
        }
      }
    })

   $urlRouterProvider.otherwise("/login");
});

