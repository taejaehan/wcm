wcm.controller("ProfileController", function($scope, $state, $http, AuthService) {

	var user = JSON.parse(window.localStorage['user'] || '{}');

	if (user.isAuthenticated === true) {
		$scope.userCheck = true;
		$scope.user = user;

		$scope.cards = [];
		$scope.watch = true;
		$scope.message = '';

		var request = $http({
	    method: "get",
	    url: mServerAPI + "/cards/" + user.userid,
	    crossDomain : true,
	    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
	    cache: false
	  });

	  request.success(function(data) {

	  	for (var i = 0; i < data.cards.length; i++) {
	  		if (data.cards[i].status === "0") {
          data.cards[i].statusDescription = "위험요소가 등록되었습니다.";
        } else if (data.cards[i].status === "33") {
          data.cards[i].statusDescription = "위험요소가 등록되었습니다.";
        } else if (data.cards[i].status === "66") {
          data.cards[i].statusDescription = "위험요소를 해결 중 입니다.";
        } else {
          data.cards[i].statusDescription = "위험요소가 해결 되었습니다.";
        }

	  		var card = data.cards[i];
	  		$scope.cards.push(card);	
	  	}
	  	
	  	if(data.cards.length === 0) {
	  		$scope.message = "참여 중인 프로젝트가 없습니다."
	  	}
	  });


	  var statusPost = function(card) {
	  	var status = card.status;

      var formData = { status: status };
      var postData = 'statusData='+JSON.stringify(formData);

      var request = $http({
          method: "post",
          url: mServerAPI + "/cardDetail/" + card.id + "/status",
          crossDomain : true,
          data: postData,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          cache: false
      });

      request.success(function(data) {

        var i = 0;
        while( i < $scope.cards.length) {

          if ($scope.cards[i].id === card.id) {
            
            if (card.status === "33") {
		          $scope.cards[i].statusDescription = "위험요소가 등록되었습니다.";
		        } else if (card.status === "66") {
		          $scope.cards[i].statusDescription = "위험요소를 해결 중 입니다.";
		        } else {
		          $scope.cards[i].statusDescription = "위험요소가 해결 되었습니다.";
		        }
            break;
          } 
          i ++;
        }
      });
	  };

	  $scope.idea = function(card) {
	  	card.status = "33";
	  	statusPost(card);
	  }

	  $scope.doing = function(card) {
	  	card.status = "66";
	  	statusPost(card);
	  }

	  $scope.done =function(card) {
	  	card.status = "100";
	  	statusPost(card);
	  }


	} else {
		$scope.userCheck = false;
	}

	$scope.goLogin = function() {
		$state.go('fblogin');
	}

	$scope.logOut = function() {
		AuthService.logout();

		window.localStorage['user'] = null;
		$state.go('fblogin');
	}
	
	$scope.showChanges = function() {
		$scope.watch = true;
	}

	$scope.showActivities = function() {
		$scope.watch = false;
	}

	$scope.config = function() {
    $state.go("tabs.config");
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
