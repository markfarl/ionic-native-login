angular.module('services', [])

.service('UserService', function() {

//for the purpose of this example I will store user data on ionic local storage but you should save it on a database



  var setUser = function(user_data) {
    window.localStorage.starter_facebook_user = JSON.stringify(user_data);
  };

  var getUser = function(){
    return JSON.parse(window.localStorage.starter_facebook_user || '{}');
  };

  return {
    getUser: getUser,
    setUser: setUser
  };
})
.factory('Account', function($http, serverUrl) {
  return {
    getProfile: function() {
      return $http.get(serverUrl+'/api/me');
    },
    updateProfile: function(profileData) {
      return $http.put(serverUrl+'/api/me', profileData);
    },
    getQuestions: function(data){
      return $http.get(serverUrl+'/api/me/questions');
    },
    updateQuestions: function(data){
      return $http.put(serverUrl+'/api/me/questions', {questions: data});
    },
    updateLikes: function(data){
      return $http.put(serverUrl+'/api/me/likesdata', {likesdata: data});
    },
    updateSentiment: function(data){
      return $http.put(serverUrl+'/api/me/updatesentiment', {data: data});
    }
  };
})
.factory('stateService', function($state) {
  return {
    goState: function (path) {
      $state.go(path);
    }
  };
});
