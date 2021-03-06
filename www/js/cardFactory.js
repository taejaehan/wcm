//==============================================================================
// * Card Detail Factory *
//==============================================================================
wcm.factory('CardDetailFactory', function($http, $ionicLoading, $rootScope) {

  function getCard(cardId, callback) {
    var request = $http({
      method: "get",
      url: mServerAPI + "/cardDetail/" + cardId,
      crossDomain : true,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      cache: false
    });

    request.success(function(data) {
      var cardData = data.cards[0];
      callback(cardData);
    });
    request.error(function(error) {
      console.log('error : ' + JSON.stringify(error));
    });
  }


  function getComment(callback) {
    var request = $http({
        method: "get",
        url: mServerAPI + "/comments",
        crossDomain : true,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
        cache: false
    });

    request.success(function(data) {
      var commentData = data.comments;
      callback(commentData);
    });
    request.error(function(error) {
      console.log('error : ' + JSON.stringify(error));
    });
  }


  function addComment(postData, callback) {
    var request = $http({
        method: "post",
        url: mServerAPI + "/comments",
        crossDomain : true,
        data: postData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
        cache: false
    });

    request.success(function(data) {
      $ionicLoading.hide();
      callback(data);
    });
    request.error(function(error){
      console.log('error : ' + JSON.stringify(error));
      $ionicLoading.hide();
    });
  }


  function deleteComment(comment, callback) {
    var formData = { post_id: comment.post_id };
    var postData = 'commentData='+JSON.stringify(formData);
    var request = $http({
        method: "post",
        url: mServerAPI + "/comment/" + comment.id + "/delete",
        crossDomain : true,
        data: postData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
    });

    request.success(function() {
      $ionicLoading.hide();
      callback();
    });
    request.error(function(error){
      console.log('error : ' + JSON.stringify(error));
      $ionicLoading.hide();
    });
  }


  // function changeMakers(postData, callback) {
  //   var request = $http({
  //       method: "post",
  //       url: mServerAPI + "/toggleChange",
  //       crossDomain : true,
  //       data: postData,
  //       headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
  //       cache: false
  //   });

  //   request.success(function(data) {
  //     $ionicLoading.hide();
  //     callback(data);
  //   });
  //   request.error(function(error){
  //     console.log('add change ERROR : ' + error);
  //     $ionicLoading.hide();
  //   });
  // }
  function changeMakers(formData, scope, user, change) {
    var postData = 'changeData='+JSON.stringify(formData);
    var request = $http({
        method: "post",
        url: mServerAPI + "/toggleChange",
        crossDomain : true,
        data: postData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
        cache: false
    });

    request.success(function(data) {
      $ionicLoading.hide();
      console.log('data.status : ' + data.status);
      if(formData.change){
        var changerObject = {
                              user_id: String(user.userid),
                              changeUser: [{
                                            userimage: user.userimage,
                                            username: user.username
                                          }]
                            };

        user.changes.push(formData.post_id+'');
        window.localStorage['user'] = JSON.stringify(user);
        scope.changers.push(changerObject);
        scope.changerImage = true;
        if(data.status == PROGRESS_START || data.status == PROGRESS_ONGOING){
          document.getElementsByClassName("progress-bar")[0].className =
           document.getElementsByClassName("progress-bar")[0].className.replace
              ( 'progress-'+scope.card.status, 'progress-'+data.status );
          document.getElementsByClassName("change-button")[0].className =
           document.getElementsByClassName("change-button")[0].className.replace
              ( 'status-'+scope.card.status, 'status-'+data.status );
          scope.card.status = data.status
          if (data.status === PROGRESS_START) {
            scope.card.statusDescription = PROGRESS_START_TEXT;
            scope.statusIcon = "project-start";
          } else if (data.status ===PROGRESS_ONGOING) {
            scope.card.statusDescription = PROGRESS_ONGOING_TEXT;
            scope.statusIcon = "project-ongoing";
          };
        };
      }else{
        // Change List에서 Card 삭제
        var changeIndex = scope.changeList.indexOf(change);
        scope.changeList.splice(changeIndex, 1);
        // User가 local storage에서 가지고 있는 change card id 삭제
        var postIndex = user.changes.indexOf(change.id);
        user.changes.splice(postIndex, 1);
        window.localStorage['user'] = JSON.stringify(user);
      };

      if(data.status == PROGRESS_START || data.status == PROGRESS_ONGOING){
        var i = 0;
        while( i < $rootScope.allData.cards.length) {
          if ($rootScope.allData.cards[i].id == formData.post_id) {
            $rootScope.allData.cards[i].status = data.status;
            break;
          }
          i ++;
        }
      }
    });
    request.error(function(error){
      console.log('add change ERROR : ' + error);
      $ionicLoading.hide();
    });
  }


  return {
    getCard: getCard,
    getComment: getComment,
    addComment: addComment,
    deleteComment: deleteComment,
    changeMakers: changeMakers
  };
});


//==============================================================================
// * Card List Factory *
//==============================================================================
wcm.factory('CardsFactory', function($http, $ionicLoading) {

  function getCards(userId, callback) {
    console.log("Login User Check");
    console.log(userId);

    if (userId == null) {
      var request = $http({
          method: "get",
          url: mServerAPI + "/cards",
          crossDomain : true,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          cache: false
      });
    } else {
      var request = $http({
          method: "get",
          url: mServerAPI + "/cards/" + userId,
          crossDomain : true,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          cache: false
      });
    }

    request.success(function(data) {
      $ionicLoading.hide();
      // console.log('success : ' + JSON.stringify(data));
      console.log('success length : ' + data.cards.length);
      window.localStorage['cardList'] = JSON.stringify(data);
      // CardService.sortCardList = data;
    });
    request.error(function(error){
      $ionicLoading.hide();
      console.log('error : ' + JSON.stringify(error));
    });
  }

  return {
    getCards: getCards
  };
});


//==============================================================================
// * Card Block Factory *
//==============================================================================
wcm.factory('CardBlockFactory', function($http, $ionicLoading, CardService) {

  function postHide(userId, cardId) {
    var postId = parseInt(cardId);
    var formData = { user_id: userId, block_post_id: postId };
    var postData = 'blockData='+JSON.stringify(formData);
    var request = $http({
        method: "post",
        url: mServerAPI + "/hide/card",
        crossDomain : true,
        data: postData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
    });
    request.success(function() {
      $ionicLoading.hide();
    });
    request.error(function(error){
      console.log('error : ' + JSON.stringify(error));
      $ionicLoading.hide();
    });
  }

  function userBlock(userId, block_userId) {
    var block_userId = parseInt(block_userId);
    var formData = { user_id: userId, block_user_id: block_userId };
    console.log(formData);
    var postData = 'blockData='+JSON.stringify(formData);
    var request = $http({
        method: "post",
        url: mServerAPI + "/block/user",
        crossDomain : true,
        data: postData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
    });
    request.success(function() {
      $ionicLoading.hide();
    });
    request.error(function(error){
      console.log('error : ' + JSON.stringify(error));
      $ionicLoading.hide();
    });
  }

  function postBlock(userId, blockCardId, blockUserId) {
    console.log('postBlock');
    var postId = parseInt(blockCardId);
    var formData = { user_id: userId, block_post_id: postId, block_user_id: blockUserId};
    var postData = 'blockData='+JSON.stringify(formData);
    var request = $http({
        method: "post",
        url: mServerAPI + "/block/card",
        crossDomain : true,
        data: postData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
    });
    request.success(function() {
      $ionicLoading.hide();
    });
    request.error(function(error){
      console.log('error : ' + JSON.stringify(error));
      $ionicLoading.hide();
    });
  }

  return {
    postHide: postHide,
    userBlock: userBlock,
    postBlock: postBlock
  }
});
