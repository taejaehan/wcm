var mServerUrl = 'http://192.168.20.45:3000/wcm_php';
var mServerAPI = mServerUrl + '/controllers/api.php';
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

   $urlRouterProvider.otherwise("/tab/home");
})

wcm.controller("HomeController", function($scope, $state, $cordovaCamera, $http, $timeout) {
    
    $scope.$on('$ionicView.afterEnter', function(){
      $scope.doRefresh();
    });

    $scope.doRefresh = function() {
    
      console.log('Refreshing!');
      $timeout( function() {
        var request = $http({
            method: "get",
            url: mServerAPI + "/card",
            crossDomain : true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            cache: false
        });

        $scope.cards = [];
        /* Successful HTTP post request or not */
        request.success(function(data) {
            for (var i = 0; i <  data.cards.length; i++) {
                var object =  data.cards[i];
                // console.log(object.id + ' - ' + object.title + " " + object.description);
                $scope.cards.push(object);
            }
        });

        //Stop the ion-refresher from spinning
        $scope.$broadcast('scroll.refreshComplete');
      
      }, 1000);
    };
});
