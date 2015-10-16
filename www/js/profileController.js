wcm.controller("ProfileController", function($scope, $state, $http, AuthService, $window, $ionicPopup) {

	var user = JSON.parse(window.localStorage['user'] || '{}');

	console.log('ProfileController user ' + user);
	console.log('ProfileController user.isAuthenticated ' + user.isAuthenticated);
	if (user.isAuthenticated === true) {
		$scope.userCheck = true;
		$scope.user = user;

		$scope.cards = [];
		$scope.changes = [];
		$scope.watch = true;
		$scope.message1 = '';
		$scope.message2 = '';


		// User가 Change Supporters로 참여중인 Change List 가져오기
		var request1 = $http({
	    method: "get",
	    url: mServerAPI + "/change/" + user.userid,
	    crossDomain : true,
	    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
	    cache: false
	  });

	  request1.success(function(data) {
	  	for (var i = 0; i < data.changes.length; i++) {
	  		if(data.changes[i].post.length > 0 ){	//add by tjhan 151007
		  		if (data.changes[i].post[0].status === PROGRESS_START) {
	          data.changes[i].post[0].statusDescription = PROGRESS_START_TEXT;
	          data.changes[i].post[0].statusIcon = "ion-alert-circled";
	        } else if (data.changes[i].post[0].status === PROGRESS_ONGOING) {
	          data.changes[i].post[0].statusDescription = PROGRESS_ONGOING_TEXT;
	          data.changes[i].post[0].statusIcon = "ion-gear-b";
	        } else {
	          data.changes[i].post[0].statusDescription = PROGRESS_COMPLETED_TEXT;
	          data.changes[i].post[0].statusIcon = "ion-happy-outline";
	        }

		  		var change = data.changes[i].post[0];
		  		$scope.changes.push(change);
		  	}
	  	}

	  	if(data.changes.length === 0) {
	  		$scope.message1 = "Change Supporters로 참여중인 프로젝트가 없습니다."
	  	}
	  });


	  // User가 작성한 Card List 가져오기
		var request2 = $http({
	    method: "get",
	    url: mServerAPI + "/cards/" + user.userid,
	    crossDomain : true,
	    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
	    cache: false
	  });

	  request2.success(function(data) {

	  	for (var i = 0; i < data.cards.length; i++) {
	  		if (data.cards[i].status === PROGRESS_START) {
          data.cards[i].statusDescription = PROGRESS_START_TEXT;
          data.cards[i].statusIcon = "ion-alert-circled";
        } else if (data.cards[i].status === PROGRESS_ONGOING) {
          data.cards[i].statusDescription = PROGRESS_ONGOING_TEXT;
          data.cards[i].statusIcon = "ion-gear-b";
        } else {
          data.cards[i].statusDescription = PROGRESS_COMPLETED_TEXT;
          data.cards[i].statusIcon = "ion-happy-outline";
        }

	  		var card = data.cards[i];
	  		$scope.cards.push(card);	
	  	}
	  	
	  	if(data.cards.length === 0) {
	  		$scope.message2 = "작성한 글이 없습니다."
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
            
            if (card.status === PROGRESS_START) {
		          $scope.cards[i].statusDescription = PROGRESS_START_TEXT;
		          $scope.cards[i].statusIcon = "ion-alert-circled";
		        } else if (card.status === PROGRESS_ONGOING) {
		          $scope.cards[i].statusDescription = PROGRESS_ONGOING_TEXT;
		          $scope.cards[i].statusIcon = "ion-gear-b";
		        } else {
		          $scope.cards[i].statusDescription = PROGRESS_COMPLETED_TEXT;
		          $scope.cards[i].statusIcon = "ion-happy-outline";
		        }
            break;
          } 
          i ++;
        }
      });
	  };

	  $scope.idea = function(card) {
	  	card.status = PROGRESS_START;
	  	statusPost(card);
	  }

	  $scope.doing = function(card) {
	  	card.status = PROGRESS_ONGOING;
	  	statusPost(card);
	  }

	  $scope.done =function(card) {
	  	card.status = PROGRESS_COMPLETED;
	  	statusPost(card);
	  }

	} else {
		$scope.userCheck = false;
	}



	$scope.cancelChanger = function(change) {
		var confirmPopup = $ionicPopup.confirm({
	    title: 'We Change Makers',
	    template: 'Change Supporters 활동을 취소하시겠습니까?'
	  });

	  confirmPopup.then(function(res) {
	    if(res) {
	      var userId = parseInt(user.userid);
	      var postId = change.id;
	      var formData = { user_id: userId,
	                        post_id: postId
	                      };
	      var postData = 'changeData='+JSON.stringify(formData);

	      var request = $http({
	          method: "post",
	          url: mServerAPI + "/change/delete/" + userId + "/" + postId,
	          crossDomain : true,
	          data: postData,
	          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
	          cache: false
	      });

	      request.success(function() {
	      	// Change List에서 Card 삭제
	      	var changeIndex = $scope.changes.indexOf(change);
          $scope.changes.splice(changeIndex, 1); 

          console.log(user.changes);
          // User가 local storage에서 가지고 있는 change card id 삭제
          var postIndex = user.changes.indexOf(change.id);
          user.changes.splice(postIndex, 1);
          console.log(user.changes);
	      });
	    }
	  });
	}


	$scope.goLogin = function() {
		$state.go('fblogin');
	}

	$scope.logOut = function() {
		AuthService.logout();

		window.localStorage['user'] = null;
		if(mIsWebView){
			Preferences.put('loginId', null); 
		}

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

  $scope.inquire = function() {
    $state.go("tabs.inquire");
  }


});
