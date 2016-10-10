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
.factory('Account', function($http, serverUrl, testerIDarry, $q, $ionicLoading) {
  return {
    isTesterProfile: function(){
      for(var i in testerIDarry) {
        console.log(testerIDarry[i]);
        if(testerIDarry[i]==window.localStorage.userID){
          return true;
        }else{
          return false;
        }
      }
    },
    getProfile: function() {
      return $http.get(serverUrl+'/api/me');
    },
    updateProfile: function(profileData) {
      return $http.put(serverUrl+'/api/me', profileData);
    },
    getFeedback: function(){
      return $http.get(serverUrl+'/api/me/feedback');
    },
    setFeedback: function(data){
      return $http.put(serverUrl+'/api/me/feedback',{feedback: data});
    },
    getQuestions: function(data){
      return $http.get(serverUrl+'/api/me/questions');
    },
    getExplicitQuestions: function(data){
      return $http.get(serverUrl+'/api/me/explicitquestions');
    },
    getScore: function(data){

         console.log(data);
         var questions = _(data.data).filter(function(x,i){
           return(i.slice(0,8)=='question');

         });
         var qtotal = 0;
         for(var i in questions) { qtotal += questions[i]; }

         //get now social media totals MAX is 4
         var social = _(data.data).filter(function(x,i){
           return(i.slice(0,10)=='isChecked_');
         });
         var stotal = 0;
         for(var i in social) { stotal += social[i]; }
         if(stotal>4){stotal=4}
         console.log(stotal);

         var likes = _(data.data).filter(function(x,i){
           return(i.slice(0,10)=='sharedChec');
         });
         var ltotal = 0;
         for(var i in likes) { ltotal += likes[i]; }
         if(ltotal>4){ltotal=4}
         console.log(ltotal);

         var total = qtotal+stotal+ltotal;
         return total;
    },
    getSocialScore: function(data){
      var likes = _(data).filter(function(x,i){
        return(i.slice(0,10)=='sharedChec');
      });
      var ltotal = 0;
      for(var i in likes) { ltotal += likes[i]; }
      if(ltotal>4){ltotal=4}
      return ltotal;
    },
    getPostData:  function(access) {
      var q = $q.defer();
      $ionicLoading.show({
        template: 'Retrieving facebook data...'
      });
      facebookConnectPlugin.api('/me/posts?fields=likes.limit(1).summary(true),shares,created_time,status_type,with_tags,comments.limit(1).summary(true),message,link,place,picture&access_token=' + access+'&limit=1000', null,
        function (response) {
          $ionicLoading.hide();
          return q.resolve(response);
        });
      return q.promise;
    },
    getPostTaggedData:  function(access) {
      var q = $q.defer();
      var fullresponse;
      $ionicLoading.show({
        template: 'Analysing facebook data...'
      });
      facebookConnectPlugin.api('/me/tagged?fields=likes.limit(1).summary(true),shares,created_time,status_type,with_tags,comments.limit(1).summary(true),message,link,place,picture&access_token=' + access+'&limit=1000', null,
        function (response) {
          fullresponse = response.data;
          facebookConnectPlugin.api('/me/photos?fields=likes.limit(1).summary(true),created_time,from,shares,comments.limit(1).summary(true),message,link,place,picture&access_token=' + access+'&limit=1000', null,
            function (response) {
              $ionicLoading.hide();
              var totalrespeonse = _(fullresponse).union(response.data);
              totalrespeonse = _(totalrespeonse).sortBy('created_time');
              return q.resolve(totalrespeonse);
            });
        });
      return q.promise;
    },
    getPageLikes: function(access){
      var q = $q.defer();
      var fullresponse;
      $ionicLoading.show({
        template: 'Analysing facebook data...'
      });
      facebookConnectPlugin.api('/me/likes?fields=name,category,created_time&access_token=' + access+'&suppress_response_codes=true&limit=100', ['email', 'public_profile', 'user_posts', 'user_likes'],
        function (response) {
          $ionicLoading.hide();
          return q.resolve(response);
        }
      );
      return q.promise;
    },
    getEventData: function(access){
      var q = $q.defer();
      var fullresponse;
      $ionicLoading.show({
        template: 'Analysing facebook data...'
      });
      facebookConnectPlugin.api('/me/events/?fields=picture,start_time,name,rsvp_status,attending.limit(1).summary(true)&access_token=' + access+'', ['email', 'public_profile', 'user_posts', 'user_likes'],
        function (response) {
          $ionicLoading.hide();
          console.log(response);
          return q.resolve(response);
        }
      );
      return q.promise;
    },
    updateQuestions: function(data){
      return $http.put(serverUrl+'/api/me/questions', {questions: data});
    },
    updateExplicitQuestions: function(data){
      return $http.put(serverUrl+'/api/me/explicitquestions', {explicitQuestions: data});
    },
    updateLikes: function(data){
      return $http.put(serverUrl+'/api/me/likesdata', {likesdata: data});
    },
    updateSentiment: function(data){
      return $http.put(serverUrl+'/api/me/updatesentiment', {data: data});
    },
    getFBfeed: function(access){
      var q = $q.defer();
       facebookConnectPlugin.api('/me/feed?fields=likes,shares,comments,message&access_token=' + access +'&limit=200', null,
        function (response) {
          window.localStorage.fbfeed = JSON.stringify(response);
          console.log('success');
          q.resolve(response);
        });
      return q.promise();
    }
  };
})
  .factory('Listings', function($http, serverUrl, $q, $ionicLoading) {
    return{
      createDetailsBox: function(data){
        var html='';
        html += '<div class="card-footer stats">';
        if(data.comments.summary.total_count>0){
          html += '<span><i class="icon ion-chatboxes">'+data.comments.summary.total_count+' Comments &nbsp;&nbsp; </i></span>';
        }
        if(data.likes.summary.total_count>0){
          html += '<span><i class="icon ion-thumbsup">'+data.likes.summary.total_count+' Likes &nbsp; &nbsp;</i></span>';
        }
        if(data.shares!==undefined){
          html += '<span><i class="icon ion-android-share-alt">'+data.shares.count+' Shares </i></span>';
        }
        html += '</div>';
        return html;
      },
      createEventDetailsBox: function(data){
        var html='';
        html += '<div class="card-footer stats">';
        if(data.attending.summary.count>0){
          html += '<span><i class="icon ion-checkmark"> '+data.attending.summary.count+' Attending </i></span><br>';
        }
        if(data.declined.summary.count>0){
          html += '<span><i class="icon ion-close"> '+data.declined.summary.count+' Declined </i></span><br>';
        }
        if(data.interested.summary.count>0){
          html += '<span><i class="icon ion-minus-circled"> '+data.interested.summary.count+' Interested </i></span>';
        }
        html += '</div>';
        return html;
      },
      checkMessage: function(data){
        if(data==undefined){
          return 'You shared an Image';
        }else{
          return ''+data+''
        }
      },
      makedate: function(data){
      var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
      ];

      var date = new Date(data);
      var day = date.getDate();
      var monthIndex = date.getMonth();
      var year = date.getFullYear();
      var time = date.getHours();
      var mins = date.getMinutes();

      return day + ' ' + monthNames[monthIndex] + ' ' + year+' at '+time+':'+mins;
    }
    }
  })
  .factory('Score', function($http, serverUrl, $q, $ionicLoading) {
    var getUSerAverageandTimeObject = function(data,type){
      if(type==null){
        var timestamps = _(data).pluck('created_time');
      }else{
        var timestamps = _(data).pluck('start_time');
      }


      var diff = [];
      var lenght = timestamps.length - 1;

      for (var i in timestamps) {

        var x = parseInt(i) + 1;
        if (x < timestamps.length) {
          var date1 = new Date(timestamps[i]);
          var date2 = new Date(timestamps[x]);
          diff[i] = Math.abs(date2 - date1) / 36e5;
        }
      }
      var sum = 0;
      for (var i = 0; i < diff.length; i++) {
        sum += diff[i]; //don't forget to add the base
      }
      var avg = sum / diff.length;
      console.log(avg);

      var score;
      if (avg < 48) {
        score = 4
      } else if (avg < 336) {
        score = 3
      } else if (avg < 1440) {
        score = 2
      } else if (avg < 8760) {
        score = 1
      } else {
        score = 0;
      }
      return {
        score: score,
        raw: avg
      }

    };
    var getcategoryAmount = function(data, catArray){
      var result = 0;
      for (var i in data) {
        for(var x in catArray){
          if(data[i] == catArray[x]){
            result++;
          }
        }
      }
      return result;
    };
    return {
      getQuestion1: function (data) {
        return getUSerAverageandTimeObject(data);
      },

      getQuestion2: function (data) {
        var list =  _(data).filter(function(obj) {
          if (obj.from !== undefined) {
            if (obj.from.id == window.localStorage.userID && obj.picture!==undefined) {
              return true;
            }
          }
        });
        return getUSerAverageandTimeObject(list);
      },
      getQuestion3: function (data) {
        var list = _(data).filter(function (obj) {
          if (obj.link !== undefined && (obj.link).substr(0,20) !== 'https://www.facebook') {
            return true;
          }
        });
        return getUSerAverageandTimeObject(list);
      },
      getQuestion4: function (data) {
        var list = _(data).filter(function (obj) {
          if (obj.link == undefined && obj.picture == undefined) {
            return true;
          }
        });
        return getUSerAverageandTimeObject(list);
      },
      getQuestion5: function (data) {
        var list = _(data).filter(function (obj) {
          if (obj.status_type == 'shared_story' && (obj.link).substr(0,20) == 'https://www.facebook') {
            return true;
          }
        });
        return getUSerAverageandTimeObject(list);
      },
      getQuestion6: function (data) {
        console.log(data);
        return getUSerAverageandTimeObject(data);
      },

      getQuestion7: function (data) {
        var list =  _(data).filter(function(obj){
          if(obj.from!==undefined){
            console.log(obj.from.id);
            /*if(obj.with_tags!==undefined){
             for(var i in obj.with_tags.data) {
             console.log(obj.with_tags.data[i].id);
             console.log(window.localStorage.userID);
             if(obj.with_tags.data[i].id == window.localStorage.userID){
             return true;
             }
             }
             }OLD WAY FB DOESNT SEND YOUR PSOT TAGS EVEN IF THE ARE*/
            if(obj.from.id==window.localStorage.userID){
              return true;
            }
          }
        });
        return getUSerAverageandTimeObject(list);
      },
      getQuestion8: function (data) {
        var list =  _(data).filter(function(obj){
          if(obj.with_tags!==undefined){
              return true;
          }
        });
        return getUSerAverageandTimeObject(list);
      },
      getQuestion9: function (data) {
        return getUSerAverageandTimeObject(data);
      },
      getQuestion10: function (data) {
        var list =  _(data).pluck('category');
        var total = 0;
        console.log(list);
        var entertainmentCount = getcategoryAmount(list, ['Arts/Entertainment/Nightlife','Comedian','Entertainer','Actor/Director','Movie','Producer','TV/Movie Award','Fictional Character','TV Show','TV Network','TV Channel']);
        var SportsCount = getcategoryAmount(list, ['Sports League','Professional Sports Team','Coach','Amateur Sports Team','School Sports Team','Athlete']);
        var politicalCount = getcategoryAmount(list, ['Monarch','Politician','Coach','Government Official','Legal/Law','Political Party','Cause','Government Organization','Non-Profit Organization']);
        var musicCount = getcategoryAmount(list, ['Album','Song','Musician/Band','Musical Instrument','Playlist','Music Video','Concert Tour','Concert Venue','Radio Station','Record Label','Music Award','Music Chart']);
        var otherCount  = list.length-(entertainmentCount+SportsCount+politicalCount+musicCount);
        if(entertainmentCount>1){
          total++
        }
        if(SportsCount>1){
          total++
        }
        if(politicalCount>1){
          total++
        }
        if(musicCount>1){
          total++
        }
        if(otherCount>1){
          total++
        }
        console.log(total);
        if(total>4){
          total=4;
        }
        return {
          score: total,
          raw: {
            entertainment: entertainmentCount,
            sports: SportsCount,
            politics: politicalCount,
            music: musicCount,
            other: otherCount
          }
        }

      },
      getQuestion11: function (data) {
        console.log(data);
        return getUSerAverageandTimeObject(data.data,1);
      }
    }
  })
.factory('stateService', function($state) {
  return {
    goState: function (path) {
      $state.go(path);
    }
  };
});
