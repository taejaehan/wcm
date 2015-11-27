//==============================================================================
// * Card Detail Factory *
//==============================================================================
wcm.factory('CardDetailFactory', function($http, $ionicLoading) {

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


  function changeMakers(postData, callback) {
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
      callback(data);
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
          url: mServerAPI + "/cards" + userId,
          crossDomain : true,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          cache: false
      });
    }

    request.success(function(data) {
      $ionicLoading.hide();
      window.localStorage['cardList'] = JSON.stringify(data);
      // CardService.sortCardList = data;
    });
    request.error(function(error){
      $ionicLoading.hide();
      console.log('error : ' + JSON.stringify(error));
    });
  }

  return {
    cards: getCards
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
      CardService.temporaryPost = null;
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
      CardService.temporaryPost = null;
    });
    request.error(function(error){
      console.log('error : ' + JSON.stringify(error));
      $ionicLoading.hide();
    });
  }

  function postBlock(userId, cardId) {
    var postId = parseInt(cardId);
    var formData = { user_id: userId, block_post_id: postId };
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
      CardService.temporaryPost = null;
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
