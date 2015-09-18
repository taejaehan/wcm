wcm.controller("LoginController", function($scope, $rootScope, $state, $http, AuthService) {


	// Kakao.Auth.createLoginButton({

 //    container: '#kakao-login-btn',


 //    success: function(authObj) {
	//     Kakao.API.request({
 //        url: '/v1/user/me',
 //        success: function(res) {
 //        	console.log(res);
 //        	res.properties.like = [];
        	

 //        	AuthService.kakaoLogin(res);

 //          var user_id = res.id;
 //          var username = res.properties.nickname;
	// 	      var userimage = res.properties.thumbnail_image;
	// 	      var sns = "kakao";

	// 	      var formData = {
	// 				      						user_id: user_id,
	// 				                  username: username,
	// 				                  userimage: userimage,
	// 				                  sns: sns
	// 				          			};

	// 	      $rootScope.$emit('loginSuccess');

	// 	      var postData = 'userData='+JSON.stringify(formData);
	// 	      var request = $http({
	// 	          method: "post",
	// 	          url: mServerAPI + "/users",
	// 	          crossDomain : true,
	// 	          data: postData,
	// 	          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
	// 	          cache: false
	// 	      });

	// 	      /* Successful HTTP post request or not */
	// 	      request.success(function(data) {

	// 					$state.go("tabs.home");
	// 	      });


 //        },
 //        fail: function(error) {
 //          alert(JSON.stringify(error))
 //        }
 //      });
 //    },
 //    fail: function(err) {
 //      alert(JSON.stringify(err))
 //    }
 //  });


	$scope.data = {};

	$scope.register = function() {
    AuthService.login($scope.data.username, $scope.data.password);
  };

  $scope.skipLogin =function() {
  	AuthService.skipLogin();
  }

});
