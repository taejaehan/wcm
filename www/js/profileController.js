wcm.controller("ProfileController", function($scope, $state, $http, AuthService, $window, $ionicPopup, $ionicHistory,$ionicLoading, $timeout, CardService) {

	var user = JSON.parse(window.localStorage['user'] || '{}');

	console.log('ProfileController user ' + user);
	console.log('ProfileController user.isAuthenticated ' + user.isAuthenticated);
	
	if (user.isAuthenticated === true) {
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
					if (data.reportList[i].status === PROGRESS_START) {
						data.reportList[i].statusDescription = PROGRESS_START_TEXT;
						data.reportList[i].statusIcon = "project-start";
					} else if (data.reportList[i].status === PROGRESS_ONGOING) {
						data.reportList[i].statusDescription = PROGRESS_ONGOING_TEXT;
						data.reportList[i].statusIcon = "project-ongoing";
					} else {
						data.reportList[i].statusDescription = PROGRESS_COMPLETED_TEXT;
						data.reportList[i].statusIcon = "project-complete";
					}
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
					if(data.watchList[i].post.length > 0){
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

	$scope.toggleWatchProfile = function(e,id){
		CardService.toggleWatch(e,id,user);
	};
	$scope.statusPost = function(card) {
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
	      	var changeIndex = $scope.changeList.indexOf(change);
          $scope.changeList.splice(changeIndex, 1); 

          console.log(user.changes);
          // User가 local storage에서 가지고 있는 change card id 삭제
          var postIndex = user.changes.indexOf(change.id);
          user.changes.splice(postIndex, 1);
          console.log(user.changes);
	      });
	    }
	  });
	}

	$scope.cancelWatch = function(watch) {
		var confirmPopup = $ionicPopup.confirm({
	    title: mAppName,
	    template: '위험해요를 취소 하시겠습니까?',
	    cssClass: 'wcm-negative',
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
	      	var changeIndex = $scope.changeList.indexOf(change);
          $scope.changeList.splice(changeIndex, 1); 

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

	request.success(function() {
		user.username = edit_name;
		window.localStorage['user'] = JSON.stringify(user);
		console.log(user);
	});

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
						    }
						  }
						};
						// Make the API call
						$http(req).success(function(resp){
						  // Handle success
						  console.log("Ionic Push: Push success!");
						}).error(function(error){
						  // Handle error 
						  console.log("Ionic Push: Push error...");
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
		request.error(function(error){
		   console.log('error : ' + JSON.stringify(error));
		 })
		 request.success(function(data) {
		   console.log('success : ' + JSON.stringify(data));
		 });
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
