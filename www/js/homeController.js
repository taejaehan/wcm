wcm.controller("HomeController", function($scope, $rootScope, $cordovaNetwork, $state, $cordovaCamera, $http, $timeout, $stateParams) {

  var user = JSON.parse(window.localStorage['user']);
  var cardList = JSON.parse(window.localStorage['cardList'] || '{}');
  console.log(user);

  $scope.page = 0;
  $scope.cards = [];
  $rootScope.allData = { 
                          cards: []
                       };
               
  $scope.doRefresh = function(refresh) {

    //init이면(pull to refresh) 첫 페이지를 다시 불러온다
    if(refresh == 'init'){
      $scope.page = 0 ;
      $scope.cards = [];
      $rootScope.allData = {
        cards : []
      };

      //init이면 localStorage['cardList']도 갱신한다
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
    }

    if ($cordovaNetwork.isOnline) {

      /* isOnline */  
      $timeout( function() {

        var request = $http({
            method: "get",
            url: mServerAPI + "/card/" + $scope.page,
            crossDomain : true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            cache: false
        });

        request.success(function(data) {

          for (var i = 0; i <  data.cards.length; i++) {

            var address = $scope.setLocationName(data.cards[i].location_lat, data.cards[i].location_long, data.cards[i]);            
            
            if (data.cards[i].status === "0") {
              data.cards[i].statusDescription = "프로젝트가 등록되었습니다.";
            } else if (data.cards[i].status === "33") {
              data.cards[i].statusDescription = "프로젝트가 시작되었습니다.";
            } else if (data.cards[i].status === "66") {
              data.cards[i].statusDescription = "프로젝트를 진행합니다.";
            } else {
              data.cards[i].statusDescription = "프로젝트가 완료되었습니다.";
            }

            if (data.cards[i].img_path == '') {
              data.cards[i].img_path = mNoImage;
            } else {
              data.cards[i].img_path = mServerUrl + data.cards[i].img_path;
            }

            data.cards[i].address = address;
            var object =  data.cards[i];
            console.log(object);
            $scope.cards.push(object);
            $rootScope.allData.cards.push(object);

            if (user.isAuthenticated === true) {
              for(var j = 0; j < $scope.cards.length; j ++) {
                
                if(user.properties.like.indexOf($scope.cards[j].id) != -1) {
                  $scope.cards[j].watch = true;
                } else {
                  $scope.cards[j].watch = false;
                }
              }
            }

          }

          $scope.page++;
          $scope.$broadcast('scroll.infiniteScrollComplete');  

          window.localStorage['localCard'] = JSON.stringify($scope.cards);
          var localCard = JSON.parse(window.localStorage['localCard']);
          $scope.cards = localCard;

        });

        //Stop the ion-refresher from spinning
        $scope.$broadcast('scroll.refreshComplete');  
      }, 1000);
  
    } else {

      /* isOffline */
      alert("Check your network connection.");

      for (var i = 0; i < cardList.cards.length; i++) {
        var object = cardList.cards[i];
        $scope.cards.push(object);
      }
    }
  }

  $scope.findWarning = function() {
    $state.go("tabs.map");
  }

  // ==================================== reverse geocording ======================================

  $scope.setLocationName = function(latitude, longitude, card) {

    var latlng = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
    var geocoder = new google.maps.Geocoder;

    geocoder.geocode({'location': latlng}, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          card.address = results[1].formatted_address;
          return card.address;
        } else {
          window.alert('No results found');
        }
      } else {
        // window.alert('Geocoder failed due to: ' + status);
      }
    });
  }
  // ==================================== reverse geocording END ======================================
  

  // =========================== Check current user & card user =============================

  $scope.userChecked = function(card) {

    if (user.isAuthenticated === true) {
      if ( parseInt(card.user[0].user_id) === user.id ) {
        return { 'display' : 'inline-block' };
      } else {
        return { 'display' : 'none' };
      }
    } else {
      return { 'display' : 'none' }
    }
  }

  // ========================= Check current user & card user END ===========================

  // ==================================== Delete card ======================================  

  $scope.deleteCard = function(id) {
  
    if (confirm('Are you sure you want to delete?')) {
      var request = $http({
          method: "get",
          url: mServerAPI + "/cardDetail/" + id + "/delete",
          crossDomain : true,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
      });

      request.success(function() {
        location.reload();
      });
    } else {
      
    }
  }
  
  // ==================================== Delete card END ======================================  
  
  $scope.editCard = function(id) {
    $state.go('tabs.edit', { 'id': id});
  };

  // ==================================== post like_count ======================================

  $scope.toggleLike = function(e, id) {
    if (user.isAuthenticated === true) {

      if (e === true) {

        if (user.properties.like.indexOf(id) === -1) {
          user.properties.like.push(id);
          window.localStorage['user'] = JSON.stringify(user);
        }

        var i = 0;

        while( i < $rootScope.allData.cards.length) {

          if ($rootScope.allData.cards[i].id === id) {
            $rootScope.allData.cards[i].like_count ++;
            $rootScope.allData.cards[i].watch = true;
            $scope.selectedCard = $rootScope.allData.cards[i];
            break;
          }
          i ++;
        }

      } else {
        
        if (user.properties.like.indexOf(id) != -1) {
          var index = user.properties.like.indexOf(id);
          user.properties.like.splice(index, 1);
          window.localStorage['user'] = JSON.stringify(user);
        }

        var i = 0;

        while( i < $rootScope.allData.cards.length) {

          if ($rootScope.allData.cards[i].id === id) {
            $rootScope.allData.cards[i].like_count --;
            $rootScope.allData.cards[i].watch = false;
            $scope.selectedCard = $rootScope.allData.cards[i];
            break;
          }
          i ++;
        }
      }
      
      var like_count = parseInt($scope.selectedCard.like_count);
      var formData = { like_count: like_count };
      var postData = 'likeData='+JSON.stringify(formData);

      var request = $http({
          method: "post",
          url: mServerAPI + "/cardDetail/" + id + "/like",
          crossDomain : true,
          data: postData,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          cache: false
      });

      request.success(function() {
        
      });

    } else {
      alert('로그인 후에 이용 가능합니다.');
      
      var i = 0;
      while( i < $rootScope.allData.cards.length) {
        if ($rootScope.allData.cards[i].id === id) {
          $rootScope.allData.cards[i].watch = false;
          break;
        }
        i ++;
      }
    }
  }
  // ==================================== post like_count END ======================================
  
  $scope.showMap = function(lat, lon) {
    var latlng = new google.maps.LatLng(lat, lon);
    $state.go('tabs.location_h', { 'latlng': latlng});
  }

});




