wcm.controller("LoginController", function($scope, $rootScope, $state, $http) {


		Kakao.Auth.createLoginButton({

      container: '#kakao-login-btn',


      success: function(authObj) {
		    Kakao.API.request({
	        url: '/v1/user/me',
	        success: function(res) {

	          window.localStorage['user'] = JSON.stringify(res);
	          var user = JSON.parse(window.localStorage['user'] || '{}');
	          var user_id = user.id;
	          var username = user.properties.nickname;
			      var userimage = user.properties.thumbnail_image;
			      var sns = "kakao";

			      var formData = {
						      						user_id: user_id,
						                  username: username,
						                  userimage: userimage,
						                  sns: sns
						          			};

			      $rootScope.$emit('loginSuccess');

			      var postData = 'userData='+JSON.stringify(formData);
			      var request = $http({
			          method: "post",
			          url: mServerAPI + "/users",
			          crossDomain : true,
			          data: postData,
			          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
			          cache: false
			      });

			      /* Successful HTTP post request or not */
			      request.success(function(data) {

			      });

						$state.go("tabs.home");

	        },
	        fail: function(error) {
	          alert(JSON.stringify(error))
	        }
	      });
      },
	    fail: function(err) {
	      alert(JSON.stringify(err))
      }
    });

});
