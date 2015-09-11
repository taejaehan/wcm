wcm.controller("PostController", function($scope, $http, $stateParams) {
    
  if (window.localStorage['user'] != null) {
    var user = JSON.parse(window.localStorage['user'] || '{}');
  }

	$scope.postId = $stateParams.postId;
  $scope.cards = [];
  $scope.comments = [];
  $scope.comments_count = 0;
  
  // $scope.like_count = [];

  var request = $http({
    method: "get",
    url: mServerAPI + "/cardDetail/" + $scope.postId,
    crossDomain : true,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    cache: false
  });

  request.success(function(data) {

    $scope.postTitle = data.cards[0].title;
    $scope.postDescription = data.cards[0].description;
    $scope.postImage = data.cards[0].img_path;
    $scope.lat = data.cards[0].location_lat;
    $scope.lng = data.cards[0].location_long;
    $scope.like_count = data.cards[0].like_count;
    $scope.status = data.cards[0].status;
    $scope.initMap(data);

    if (data.cards[0].status === "0") {
      data.cards[0].statusDescription = "프로젝트가 등록되었습니다.";
    } else if (data.cards[0].status === "33") {
      data.cards[0].statusDescription = "프로젝트가 시작되었습니다.";
    } else if (data.cards[0].status === "66") {
      data.cards[0].statusDescription = "프로젝트를 진행합니다.";
    } else {
      data.cards[0].statusDescription = "프로젝트가 완료되었습니다.";
    }

    $scope.statusDescription = data.cards[0].statusDescription;

  });

  // ==================================== post like_count ======================================

  // if(user.properties.like.indexOf($scope.postId) != -1){
  //   $scope.watch = true;
  // }

  $scope.toggleLike = function(e) {
    
    if (e === true) {

      if (user.properties.like.indexOf($scope.postId) === -1) {
        $scope.like_count ++;
        user.properties.like.push($scope.postId);
        window.localStorage['user'] = JSON.stringify(user);
        console.log(window.localStorage['user']);
      } 

    } else {

      if (user.properties.like.indexOf($scope.postId) != -1) {
        $scope.like_count --;
        var index = user.properties.like.indexOf($scope.postId);
        user.properties.like.splice(index, 1);
        window.localStorage['user'] = JSON.stringify(user);
        console.log(window.localStorage['user']);
      } 

    }

    var like_count = parseInt($scope.like_count);
    var formData = { like_count: like_count };
    var postData = 'likeData='+JSON.stringify(formData);

    var request = $http({
        method: "post",
        url: mServerAPI + "/cardDetail/" + $scope.postId + "/like",
        crossDomain : true,
        data: postData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
        cache: false
    });

    request.success(function() {

    });
  }

  // ==================================== post like_count END ======================================

  // ==================================== reverse geocording ======================================

  $scope.initMap = function(data) {
    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 8,
      center: {lat: Number(data.cards[0].location_lat), lng: Number(data.cards[0].location_long)}
    });
    var geocoder = new google.maps.Geocoder;
    var infowindow = new google.maps.InfoWindow;

    $scope.geocodeLatLng(geocoder, map, infowindow);

  }

  $scope.geocodeLatLng = function(geocoder, map, infowindow) {
    // var input = document.getElementById('latlng').value;
    // var latlngStr = input.split(',', 2);
    // var latlng = {lat: parseFloat(latlngStr[0]), lng: parseFloat(latlngStr[1])};

    var latlng = { lat: parseFloat($scope.lat), lng: parseFloat($scope.lng) };

    geocoder.geocode({'location': latlng}, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          map.setZoom(11);
          var marker = new google.maps.Marker({
            position: latlng,
            map: map
          });
          
          infowindow.setContent(results[1].formatted_address);
          infowindow.open(map, marker);

          $scope.address = results[1].formatted_address;
          
        } else {
          window.alert('No results found');
        }
      } else {
        // window.alert('Geocoder failed due to: ' + status);
      }
    });
  }

  // ==================================== reverse geocording END ======================================

  // ==================================== Get comments ======================================

  var request2 = $http({
      method: "get",
      url: mServerAPI + "/comments",
      crossDomain : true,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
      cache: false
  });

  /* Successful HTTP post request or not */
  request2.success(function(data) {

      for (var i = 0; i <  data.comments.length; i++) {
        var object =  data.comments[i];
        
        if (object.post_id === $stateParams.postId) {

          if (object.username === null || object.userimage === null) {
            object.username = "no nickname";
            object.userimage = "http://mud-kage.kakao.co.kr/14/dn/btqchdUZIl1/FYku2ixAIgvL1O50eDzaCk/o.jpg"
            $scope.comments.push(object);
            $scope.comments_count ++;
          } else {
            $scope.comments.push(object);
            $scope.comments_count ++;
          }
        }    
      }
  });

  // ==================================== Get comments END ======================================

  // ==================================== Post comment ======================================

  $scope.addComment =function() {
  
    var comment = document.getElementById("comment").value;
    console.log(comment);

    if ( comment === "" ) {

      alert('내용을 입력하세요.');

    } else {

      if (window.localStorage['user'] === null) {

        alert("로그인 후 이용하세요.");

      } else {
        $scope.username = user.properties.nickname;
        $scope.userimage = user.properties.thumbnail_image;
        $scope.userid = String(user.id);

        if ($scope.userimage === null) {
          $scope.userimage = "http://mud-kage.kakao.co.kr/14/dn/btqchdUZIl1/FYku2ixAIgvL1O50eDzaCk/o.jpg";
        }
      }

      var post_id = parseInt($stateParams.postId);
      var user_app_id = parseInt(user.id);

      var formData = {
                        post_id: post_id,
                        user_app_id: user_app_id,
                        content: comment
                      };

      var postData = 'commentData='+JSON.stringify(formData);

      var request = $http({
          method: "post",
          url: mServerAPI + "/comments",
          crossDomain : true,
          data: postData,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          cache: false
      });

      var formDataLocal = {
                            post_id: post_id,
                            user_app_id: user_app_id,
                            content: comment,
                            user: [{    
                                        user_id: $scope.userid,
                                        username: $scope.username,
                                        userimage: $scope.userimage
                                     }],
                            updated_at: new Date()
                          }

      $scope.comments.push(formDataLocal);

      request.success(function(data) {

        document.getElementById("comment").value = "";
        $scope.comments_count ++;

      });
    }

  }
  // ==================================== Post comment END ======================================

  // =========================== Check current user & comment user =============================

  $scope.userChecked = function(comment) {  

    if ( parseInt(comment.user[0].user_id) === user.id ) {
      return { 'display' : 'inline-block' };
    } else if (user === null) {
      return { 'display' : 'none' };
    } else {
      return { 'display' : 'none' };
    }
  }  

  // ========================= Check current user & card user END ===========================

  // ==================================== Delete comment ======================================

  $scope.deleteComment = function(comment) {

    if (confirm('Are you sure you want to delete?')) {
      var request = $http({
          method: "get",
          url: mServerAPI + "/comment/" + comment.id + "/delete",
          crossDomain : true,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
      });

      request.success(function() {

        var index = $scope.comments.indexOf(comment);
        $scope.comments.splice(index, 1); 
        $scope.comments_count --;

      });
    } else {
      
    }
  }

  // ==================================== Delete comment END======================================
});



