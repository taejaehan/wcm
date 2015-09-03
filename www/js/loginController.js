wcm.controller("LoginController", function($scope, $state, $http) {

    Kakao.init('2b1444fba3c133df8405882491640b80');

		Kakao.Auth.createLoginButton({

      container: '#kakao-login-btn',

      success: function(authObj) {
		    Kakao.API.request({
	        url: '/v1/user/me',
	        success: function(res) {
	          // alert(JSON.stringify(res));
	          // console.log(res);
	          window.localStorage['user'] = JSON.stringify(res);
	          var user = JSON.parse(window.localStorage['user'] || '{}');

	          
	          var username = user.properties.nickname;
			      var sns = "kakao";
			      var userimage = user.properties.thumbnail_image;

			      var formData = {
			                  username: username,
			                  userimage: userimage,
			                  sns: sns
			          };

			      var postData = 'userData='+JSON.stringify(formData);
			      var request = $http({
			          method: "post",
			          url: mServerAPI + "/user",
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
