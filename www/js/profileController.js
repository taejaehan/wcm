wcm.controller("ProfileController", function($scope, $state, $http) {
	
  if (window.localStorage['user'] != null) {

  	$scope.userCheck = true;

	  var user = JSON.parse(window.localStorage['user'] || '{}');
	  
		$scope.username = user.properties.nickname;
		
		if (user.properties.thumbnail_image === null) {
			$scope.userimage = "http://mud-kage.kakao.co.kr/14/dn/btqchdUZIl1/FYku2ixAIgvL1O50eDzaCk/o.jpg";
		} else {
			$scope.userimage = user.properties.thumbnail_image;
		}

		$scope.likes = user.properties.like;
		$scope.cards = [];

		$scope.logOut = function() {
			Kakao.Auth.logout(function(result){
				console.log(result);
				if (result) {
					$state.go('login');
					location.reload();
				};
			});
		} 
		
		var request = $http({
	    method: "get",
	    url: mServerAPI + "/cards/" + user.id,
	    crossDomain : true,
	    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
	    cache: false
	  });

	  request.success(function(data) {

	  	for (var i = 0; i < data.cards.length; i++) {
	  		var card = data.cards[i];
	  		$scope.cards.push(card);	
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
	  }

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

  	$scope.goLogin = function() {
  		$state.go('login');
  	}
  } 


});
