wcm.controller("LoginController", function($scope, $state) {

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
