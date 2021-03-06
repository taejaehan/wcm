wcm.controller("ProfileController", function($scope, $state, $http, AuthService, $window, 
	$ionicPopup, $ionicHistory, $ionicLoading, $timeout, CardService, CardDetailFactory) {

	var user = JSON.parse(window.localStorage['user'] || '{}');

	if (user != null && user.isAuthenticated === true) {
		$scope.userCheck = true;
		$scope.user = user;

		$scope.reportList = [];
		$scope.changeList = [];
		$scope.watchList = [];

		$scope.reportTab = true;
		$scope.changeTab = false;
		$scope.watchTab = false;

		$scope.reportEmptyMessage = '';
		$scope.changeEmptyMessage = '';
		$scope.watchEmptyMessage = '';

		$scope.pushNotification = { checked: true };
		$scope.backgroundLocation = { checked: true };

		//dmjor 페이스북으로 로그인한 경우는 adminUser true
		$scope.adminUser = user.userid == "1826451354247937";

		$ionicLoading.show({
			template: '<ion-spinner icon="bubbles"></ion-spinner><br/>로딩중..'
		});

		var request = $http({
			method: "get",
			url: mServerAPI + "/userActivities/" + user.userid,
			crossDomain : true,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
			cache: false
		});
		request.error(function(error){
			console.log('error : ' + JSON.stringify(error));
			$ionicLoading.hide();
			$ionicPopup.alert({
	        title: mAppName,
	        template: '사용자 활동 리스트를 가져오지 못 했습니다',
	        cssClass: 'wcm-error',
	      });
		});
		request.success(function(data) {
			$ionicLoading.hide();
			/*내가 제보한 위험 리스트 넣어주기*/
			if(data.reportList.length === 0) {
				$scope.reportEmptyMessage = "작성한 글이 없습니다"
			}else{
				for (var i = 0; i < data.reportList.length; i++) {
					CardService.status(data.reportList, i);
					$scope.reportList.push(data.reportList[i]);
				}
			}
			/*내가 해결한 위험 리스트 넣어주기*/
			if(data.changeList.length === 0) {
				$scope.changeEmptyMessage = "Change Supporters로 참여중인 프로젝트가 없습니다"
			}else{
				for (var i = 0; i < data.changeList.length; i++) {
					if(data.changeList[i].post.length > 0){
						if (data.changeList[i].post[0].status === PROGRESS_START) {
			          data.changeList[i].post[0].statusDescription = PROGRESS_START_TEXT;
			          data.changeList[i].post[0].statusIcon = "project-start";
			        } else if (data.changeList[i].post[0].status === PROGRESS_ONGOING) {
			          data.changeList[i].post[0].statusDescription = PROGRESS_ONGOING_TEXT;
			          data.changeList[i].post[0].statusIcon = "project-ongoing";
			        } else {
			          data.changeList[i].post[0].statusDescription = PROGRESS_COMPLETED_TEXT;
			          data.changeList[i].post[0].statusIcon = "project-complete";
			        }
				  		$scope.changeList.push(data.changeList[i].post[0]);
				  	}
				}
			}
			/*내가 위험해요 누른 위험 리스트 넣어주기*/
			if(data.watchList.length === 0) {
				$scope.watchEmptyMessage = "위험해요를 누른 프로젝트가 없습니다"
			}else{
				for (var i = 0; i < data.watchList.length; i++) {
					if(data.watchList[i].post != null && data.watchList[i].post.length > 0){
						if (data.watchList[i].post[0].status === PROGRESS_START) {
			          data.watchList[i].post[0].statusDescription = PROGRESS_START_TEXT;
			          data.watchList[i].post[0].statusIcon = "project-start";
			        } else if (data.watchList[i].post[0].status === PROGRESS_ONGOING) {
			          data.watchList[i].post[0].statusDescription = PROGRESS_ONGOING_TEXT;
			          data.watchList[i].post[0].statusIcon = "project-ongoing";
			        } else {
			          data.watchList[i].post[0].statusDescription = PROGRESS_COMPLETED_TEXT;
			          data.watchList[i].post[0].statusIcon = "project-complete";
			        }
			        //위험해요 누른 프로젝트를 가져왔으므로 watch는 true
			        data.watchList[i].post[0].watch = true;

				  		$scope.watchList.push(data.watchList[i].post[0]);
				  	}
				}
			}
		});
		//해당 device의 push정보를 set해준다 by tjhan 151113
		if(!mIsWebView){
			mDeviceUuid	 = 'd874c9de-b9f6-ef80-3542-570596882578';
		}
		var request = $http({
			method: "get",
			url: mServerAPI + "/userPush/" + mDeviceUuid,
			crossDomain : true,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
			cache: false
		});
		request.error(function(error){
			console.log('error : ' + JSON.stringify(error));
			$ionicLoading.hide();
		});
		request.success(function(push) {
			console.log('push : ' + push);
			$ionicLoading.hide();
			if(push == 1){
				$scope.pushNotification.checked = true;
			}else{
				$scope.pushNotification.checked = false;
			}

		});
	} else {
		$scope.userCheck = false;
	}
	$scope.$on('$ionicView.beforeEnter', function(){
		if(mIsWebView){
			if(typeof Preferences != 'undefined'){
			  Preferences.get('backgroundLocation', function(backgroundLocation) {
			  	console.log('get Preferences BackgroundGeoLocation : ' +  backgroundLocation);
			  	console.log('$scope.backgroundLocation.checked : ' +  $scope.backgroundLocation.checked);
			  	if(backgroundLocation == 'true' || backgroundLocation == true){
			  		$scope.backgroundLocation.checked = true;
			  	}else{
			  		$scope.backgroundLocation.checked = false;
			  	}
			  	console.log('$scope.backgroundLocation.checked : ' +  $scope.backgroundLocation.checked);
			  }, function(error){
			    console.log('get Preferences BackgroundGeoLocation error : ' +  error);
			  }); 
			}
		}
	});
	$scope.toggleWatchProfile = function(e,id){
		CardService.toggleWatch(e,id,user);
	};
	$scope.statusPost = function(card) {
	  	var status = card.status;
		var formData = { status: status };
		var postData = 'statusData='+JSON.stringify(formData);

		$ionicLoading.show({
			template: '<ion-spinner icon="bubbles"></ion-spinner>'
		});

		var request = $http({
		    method: "post",
		    url: mServerAPI + "/cardDetail/" + card.id + "/status",
		    crossDomain : true,
		    data: postData,
		    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
		    cache: false
		});
		request.error(function(error){
			console.log('add change ERROR : ' + error);
			$ionicLoading.hide();
		});
		request.success(function(data) {
			$ionicLoading.hide();
		  var i = 0;
		  while( i < $scope.reportList.length) {

		    if ($scope.reportList[i].id === card.id) {

		      if (card.status === PROGRESS_START) {
			      $scope.reportList[i].statusDescription = PROGRESS_START_TEXT;
			      $scope.reportList[i].statusIcon = "project-start";
			    } else if (card.status === PROGRESS_ONGOING) {
			      $scope.reportList[i].statusDescription = PROGRESS_ONGOING_TEXT;
			      $scope.reportList[i].statusIcon = "project-ongoing";
			    } else {
			      $scope.reportList[i].statusDescription = PROGRESS_COMPLETED_TEXT;
			      $scope.reportList[i].statusIcon = "project-complete";
			    }
			    break;
		    }
			  i ++;
		  }
		});
  };

	$scope.idea = function(card) {
	  	card.status = PROGRESS_START;
	  	$scope.statusPost(card);
  }

  $scope.doing = function(card) {
	  	card.status = PROGRESS_ONGOING;
	  	$scope.statusPost(card);
  }

  $scope.done =function(card) {
	  	card.status = PROGRESS_COMPLETED;
	  	$scope.statusPost(card);
  }

	$scope.cancelChanger = function(change) {
		var confirmPopup = $ionicPopup.confirm({
			title: mAppName,
			template: 'Change Supporters 활동을 취소하시겠습니까?',
			cssClass: 'wcm-negative',
		});

		confirmPopup.then(function(res) {
			if(res) {
			$ionicLoading.show({
				template: '<ion-spinner icon="bubbles"></ion-spinner>'
			});
			var userId = parseInt(user.userid);
			var postId = change.id;
			var formData =  {
				user_id: userId,
				post_id: postId,
				change : false
			};
			
			CardDetailFactory.changeMakers(formData, $scope, user, change);
			}
		});
	}

	$scope.goLogin = function() {
		$state.go('tabs.fblogin');
	}

	$scope.logOut = function() {
		AuthService.logout();

		window.localStorage['user'] = null;
		if(mIsWebView){
			Preferences.put('loginId', null);
		}

		$state.go('tabs.fblogin');
	}

	$scope.editProfile = function() {
		$state.go("tabs.editProfile");
	}

	$scope.showReportList = function() {
		$scope.reportTab = true;
		$scope.changeTab = false;
		$scope.watchTab = false;
	}

	$scope.showChangeList = function() {
		$scope.reportTab = false;
		$scope.changeTab = true;
		$scope.watchTab = false;
	}

	$scope.showWatchList = function() {
		$scope.reportTab = false;
		$scope.changeTab= false;
		$scope.watchTab = true;
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

  $scope.AboutUs = function(){
  		$state.go('tabs.about_us');
  }

  $scope.editDone = function() {
  	$ionicLoading.show({
		template: '<ion-spinner icon="bubbles"></ion-spinner><br/>'
	});
	var edit_name = document.getElementById("edit-name").value;
	var formData = { username: edit_name };
	var request = $http({
	    method: "post",
	    url: mServerAPI + "/profile/" + user.userid,
	    crossDomain : true,
	    data: Object.toparams(formData),
	    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
	    cache: false
	});
	request.error(function() {
		$ionicLoading.hide();
		console.log(error);
	});
	request.success(function(data) {
		$ionicLoading.hide();
		if(data.error != null){
			if(data.error == 'sameUserName'){
				$ionicPopup.alert({
					title: mAppName,
					template: '중복된 사용자 이름입니다',
					cssClass: 'wcm-negative',
				});  
				return;
			}
		}else{
			var myPopup = $ionicPopup.show({
			  template: "변경이 완료되었습니다",
			  title: mAppName,
			  cssClass: 'wcm-positive',
			  buttons: [
			    {
			      text: '<b>OK</b>',
			      type: 'button-positive',
			      onTap: function(e) {
			        $ionicHistory.goBack();
			      }
			    }
			  ]
			});
			var user = JSON.parse(window.localStorage['user'] || '{}');
			user.username = edit_name;
			window.localStorage['user'] = JSON.stringify(user);
			console.log(user);
			if(Ionic != null){
				console.log('Ionic OK');
				Ionic.io();
				var user = Ionic.User.current();
				var saveUser = function(){
				  user.set('name', edit_name);
				  user.save().then(function(success) {
				    console.log("saveUser success: " + JSON.stringify(success));
				  }, function(error) {
				    console.log("saveUser Error: " + JSON.stringify(error));
				  });
				};
				//facebook 로그인 후 ionic user를 수정한다
				Ionic.User.load(mDeviceUuid).then(function(success) {
				  console.log('loadUser success : ' + JSON.stringify(success));
				  Ionic.User.current(success);
				  user = Ionic.User.current();
				  saveUser();
				}, function(error) {
				  if (!user.id) {
				    console.log('loadUser error : ' + JSON.stringify(error));
				    //ionic플랫폼에 저장되는 user id로 device uuid를 사용한다 by tjhan 151023
				    console.log('deviceUuid : ' + mDeviceUuid);
				    user.id = mDeviceUuid;
				  }
				  saveUser();
				});
			}else{
				console.log('Ionic NO');
				$ionicLoading.hide();
			}
		}
	});

	
  }

  /*
  * message를 입력하면 push를 보냅니다
  *	wcm db에서 device token을 받아와 해당 device들에게 push를 보냅니다
  */
  $scope.sendPushNotification = function(){

		$scope.push = {}
		// An elaborate, custom popup
		var myPopup = $ionicPopup.show({
		  template: '<input type="text" ng-model="push.message">',
		  title: '메세지를 입력하세요',
		  subTitle: 'wcm사용자에게 push를 보냅니다',
		  cssClass: 'wcm-positive',
		  scope: $scope,
		  buttons: [
		    { text: 'Cancel' },
		    {
		      text: '<b>Send</b>',
		      type: 'button-positive',
		      onTap: function(e) {
		        if ($scope.push.message) {
		          //don't allow the user to close unless he enters wifi password
		          // e.preventDefault();
		          return $scope.push.message;
		        }else{
		         // e.preventDefault();
		        }
		      }
		    },
		  ]
		});

		// confirm창
		myPopup.then(function(message) {

			if(message == null ) return;

			$ionicLoading.show({
				template: '<ion-spinner icon="bubbles"></ion-spinner>'
			});
			// Define relevant info
			var tokens = [];
			var receiverNum = 0;

			//DB에 저장된 PUSH를 받기로 한 device의 TOKEN을 가져옵니다
	  		var request = $http({
	         method: "get",
	         url: mServerAPI + "/devices",
	         crossDomain : true,
	         headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
	         cache: false
	     });
	     request.success(function(data) {
	       $ionicLoading.hide();
	       console.log('Push Device Number : ' + data.devices.length);
	       receiverNum = data.devices.length;
	       for (var i = 0; i < data.devices.length; i++) {
	       	tokens.push(data.devices[i].device_token);
	       }

			//psuh 최종 확인 컨펌
			var confirmPopup = $ionicPopup.confirm({
			title: receiverNum + ' 명에게 Push 메세지를 보냅니다',
			template: message,
			cssClass: 'wcm-negative',
			});
			confirmPopup.then(function(res) {
				if(res) {
					console.log('START SEND PUSH MESSAGE');
					/** PUSH 메세지를 발송 **/
					// Encode your key
					var auth = btoa(mPrivateKey + ':');
					// Build the request object
					var req = {
					  method: 'POST',
					  url: 'https://push.ionic.io/api/v1/push',
					  headers: {
					    'Content-Type': 'application/json',
					    'X-Ionic-Application-Id': mAppId,
					    'Authorization': 'basic ' + auth
					  },
					  data: {
					    "tokens": tokens,
					    "notification": {
					      "alert": message
					    },
					    // "scheduled" : 1447834020,
					    "production": true
					  }
					};
					$ionicLoading.show({
						template: '<ion-spinner icon="bubbles"></ion-spinner>'
					});
					// Make the API call
					$http(req).success(function(resp){
						$ionicLoading.hide();
					  // Handle success
					  console.log("Ionic Push: Push success!");
					  console.log('resp : ' + JSON.stringify(resp));
					}).error(function(error){
						$ionicLoading.hide();
					  // Handle error
					  console.log("Ionic Push: Push error...");
					  console.log('error : ' + JSON.stringify(error));
					});
				} else {
					console.log('CANCEL SEND PUSH MESSAGE');
				}
			});

	     });
	     request.error(function(error){
	       $ionicLoading.hide();
	       console.log('error : ' + JSON.stringify(error))
	     });

		});
	}
  /*
  *	fb 친구를 초대합니다
  */
  $scope.inviteFriends = function(){
  		if(mIsWebView){
			// facebookConnectPlugin.appInvite(Object options, Function success, Function failure);
			facebookConnectPlugin.appInvite(    
			    {
			        url: mFacebookUrl,
			        picture: mServerUrl + '/images/invite.png'
			    }, 
			    function(obj){
			    		console.log('inviteFriends ok :  ' + JSON.stringify(obj));
			        if(obj) {
			            if(obj.completionGesture == "cancel") {
			            		console.log('inviteFriends cancel ');
			                // user canceled, bad guy
			            } else {
			            		console.log('inviteFriends invite someone ');
			                // user really invited someone :)
			            }
			        } else {
			        		console.log('inviteFriends NO invite someone ');
			            // user just pressed done, bad guy
			        }
			    }, 
			    function(obj){
			    		console.log('inviteFriends error : ' + obj);
			        // error
			        console.log(obj);
			    }
			);
		}
  }

  /*
  *	push를 받을지 안받을지 toggle합니다.
  * 현재 device uuid와 on/off를 보내서 device 테이블의 push를 수정합니다
  * 초기값은 true로 푸시를 받습니다
  */

  $scope.pushNotificationChange = function() {
    console.log('Push Notification Change', $scope.pushNotification.checked);
    if(mIsWebView){
		var pushStatus;
		if($scope.pushNotification.checked) pushStatus = 1;
		else pushStatus = 0;

		console.log('pushNotification mDeviceUuid : ' + mDeviceUuid);
		var request = $http({
		  method: "post",
		  url: mServerAPI + "/push/" + mDeviceUuid + '/' + pushStatus,
		  crossDomain : true,
		  headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
		});
		$ionicLoading.show({
			template: '<ion-spinner icon="bubbles"></ion-spinner>'
		});
		request.error(function(error){
			$ionicLoading.hide();
		   console.log('error : ' + JSON.stringify(error));
		 })
		 request.success(function(data) {
		 	$ionicLoading.hide();
		   console.log('success : ' + JSON.stringify(data));
		 });
    }
  };

  $scope.backgroundLocationChange = function() {
    console.log('backgroundLocation Change', $scope.backgroundLocation.checked);
    if(mIsWebView){
		//backgroundLocation Prefrences에 저장
		if(typeof Preferences != 'undefined'){
			Preferences.put('backgroundLocation', $scope.backgroundLocation.checked);
			console.log('backgroundLocation : ' + $scope.backgroundLocation.checked);
			if($scope.backgroundLocation.checked){
				startBackgroundLocation($http);
			}else{
				stopBackgroundLocation();
			}
		}
    }
  };
});

//profile.html에 ng-repeat에서 reverse에서 호출됨 (items을 반대로 재배열)
wcm.filter('reverse', function() {
  return function(items) {
    if(items != null){
      return items.slice().reverse();
    };
  };
});
