angular.module('controllers', [])

.controller('WelcomeCtrl', function($ionicPopup, $scope, $http, $state, $q, UserService, $ionicLoading, serverUrl) {

  //Onpage Load clear auth Header as user will be considered logged out if on this page
  $http.defaults.headers.common['Authorization'] = '';


  $scope.changeState = function(state){
    console.log(state);
    $state.go(state);
  };

  $scope.showLoginButton = function(i){
    console.log(i);
    if(i!=='A'){
      $ionicPopup.alert({
        title: 'Cannot Continue',
        template: 'Please read through the terms and click the agreement to continue'
      });
    }else{
      facebookSignIn();
    }

  };

  $scope.showContButton = function(i){
    console.log(i);
    if(i!=='A'){
      $ionicPopup.alert({
        title: 'Cannot Continue',
        template: 'Please read through the terms and click the agreement to continue'
      });
    }else{
      $state.go('welcome.consent');
    }

  };

  //This is the success callback from the login method
  var fbLoginSuccess = function(response) {
    if (!response.authResponse){
      fbLoginError("Cannot find the authResponse");
      return;
    }



    console.log(response);
    var authResponse = response.authResponse;

    getFacebookProfileInfo(authResponse)
    .then(function(profileInfo) {
      //for the purpose of this example I will store user data on local storage
      UserService.setUser({
        authResponse: authResponse,
				userID: profileInfo.id,
				name: profileInfo.name,
				email: profileInfo.email,
        picture : "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
      });

      getSetFbAuthToken(response);


    }, function(fail){
      //fail get profile info
      alert('profile info fail', fail);
    });
  };


  //This is the fail callback from the login method
  var fbLoginError = function(error){
    alert('fbLoginError', error);
    $ionicLoading.hide();

  };

  //this method is to get the user profile info from the facebook api
  var getFacebookProfileInfo = function (authResponse) {
    var info = $q.defer();

    facebookConnectPlugin.api('/me?fields=email,name&access_token=' + authResponse.accessToken, null,
      function (response) {
				console.log(response);
        info.resolve(response);
      },
      function (response) {
				console.log(response);
        info.reject(response);
      }
    );
    return info.promise;
  };


  //This gets token and sets from facebook before state change **To do: Make service eventually**
  var getSetFbAuthToken = function(success){
    //Send user data to remote server **MF**
    var accessData = {
      access_token: success.authResponse.accessToken,
      expires_in: success.authResponse.expiresIn,
      token_type: 'bearer'
    };
    $http.post(serverUrl+"/auth/facebookuser", accessData).success(function(data, status) {

        //Set the returning token in the auth header, which allows auth for profile data **MF**
        $http.defaults.headers.common['Authorization'] = 'Bearer '+data.token;
        console.log('Auth Header set');
        //Now go to home page
        $ionicLoading.hide();
        $state.go('app.home');
      })
      .error(function(data, status) {
        console.error(' error', status, data);
      });
  };

  //This method is executed when the user press the "Login with facebook" button
  var facebookSignIn = function() {
    $ionicLoading.show({
      template: 'Logging in...'
    });
    console.log(serverUrl+' ss');
    facebookConnectPlugin.getLoginStatus(function(success){
      console.log(JSON.stringify(success));
     if(success.status === 'connected'){
       console.log('succes');
        // the user is logged in and has authenticated your app, and response.authResponse supplies
        // the user's ID, a valid access token, a signed request, and the time the access token
        // and signed request each expire


       //check if we have our user saved

				var user = UserService.getUser('facebook');

				if(!user.userID)
				{
					getFacebookProfileInfo(success.authResponse)
					.then(function(profileInfo) {
            console.log(success.authResponse);
						//for the purpose of this example I will store user data on local storage
						UserService.setUser({
							authResponse: success.authResponse,
							userID: profileInfo.id,
							name: profileInfo.name,
							email: profileInfo.email,
							picture : "http://graph.facebook.com/" + success.authResponse.userID + "/picture?type=large"
						});

						//$state.go('app.home');
            //Get Set token fucntion and then go to app home
            getSetFbAuthToken(success);

					}, function(fail){
						//fail get profile info
						console.log('profile info fail', fail);
					});
				}else{
          //$state.go('app.home');
          //Get Set token fucntion and then go to app home
          getSetFbAuthToken(success);
				}

     } else {
        //if (success.status === 'not_authorized') the user is logged in to Facebook, but has not authenticated your app
        //else The person is not logged into Facebook, so we're not sure if they are logged into this app or not.
        console.log('getLoginStatus', success.status);

        //ask the permissions you need. You can learn more about FB permissions here: https://developers.facebook.com/docs/facebook-login/permissions/v2.4
        facebookConnectPlugin.login(['email', 'public_profile', 'user_posts', 'user_likes'], fbLoginSuccess, fbLoginError);
      }
    });
  };
})




  .controller('AppCtrl', function($scope, $state, $ionicPopup, $ionicLoading){

    $scope.changeState = function(state){
      console.log(state);
      $state.go(state);
    };

    $scope.showLogOutMenu = function() {

      var confirmPopup = $ionicPopup.confirm({
        title: 'Logout',
        template: 'Are you sure you want to logout',
        okText: 'Yes Logout',
        cancelText: 'No'
      });

      confirmPopup.then(function(res) {
        if (res) {
          $ionicLoading.show({
            template: 'Logging out...'
          });

          //facebook logout
          facebookConnectPlugin.logout(function(){
              $ionicLoading.hide();
              $state.go('welcome.terms');
            },
            function(fail){
              $ionicLoading.hide();
            });
        }
      });

    };


  })
  .controller('QuestionsCtrl', function($scope, Account, $http, $q, UserService, $ionicLoading, $ionicPlatform, $state){
    //Question Object
    $scope.answers = {};

    $ionicLoading.show({
      template: 'retrieving user data...'
    });

    $scope.questionmaster = [
      {
        title: 'The BigFoot application has made me more aware of my Social Media behavior.',
        model: 'question1',
        items: {
          'Strongly Disagree': 1,
          'Disagree': 2,
          'Neutral': 3,
          'Agree': 4,
          'Strongly Agree': 5
        }
      },
      {
        title: 'How often do you share private information, such as photos of friends and family on Social Media sites?',
        model: 'question2',
        items: {
          'I never share private information': 1,
          'No more than once a month': 2,
          'No more than once a week': 3,
          'I am not sure': 4,
          'Every day': 5
        }
      },
      {
        title: 'How often do you review and manage your privacy settings of your Social Media accounts?',
        model: 'question3',
        items: {
          'Every time I am informed about a change': 1,
          'At least once every 3 months': 2,
          'At least once every 6 months': 3,
          'I am not sure': 4,
          'Never': 5
        }
      },
      {
        title: 'How often do you use your Social Media credentials to sign into third-party applications?',
        model: 'question4',
        items: {
          'Never': 1,
          'At least once a month': 2,
          'At lease once a week': 3,
          'I am not sure': 4,
          'Every day': 5
        }
      },
      {
        title: "When using my Social Media credentials to sign into other applications, I don't pay attention to what information the third-party app gets access to.",
        model: 'question5',
        items: {
          'Strongly Disagree': 1,
          'Disagree': 2,
          'Neutral': 3,
          'Agree': 4,
          'Strongly Agree': 5
        }
      },
      {
        title: 'How many third-party app connections do you think you have?',
        model: 'question6',
        items: {
          '0': 1,
          '1-5': 2,
          '6-10': 3,
          '11-20': 4,
          'More than 20': 5
        }
      },
      {
        title: 'I am not concerned about what happens with my Social Media data.',
        model: 'question7',
        items: {
          'Strongly Disagree': 1,
          'Disagree': 2,
          'Neutral': 3,
          'Agree': 4,
          'Strongly Agree': 5
        }
      },
      {
        title: 'I always read and understand the Terms and Conditions when registering for a Social Media website.',
        model: 'question8',
        items: {
          'Strongly Disagree': 5,
          'Disagree': 4,
          'Neutral': 3,
          'Agree': 2,
          'Strongly Agree': 1

        }
      }];

    $scope.answers.question1 = 3;
    $scope.answers.question2 = 3;
    $scope.answers.question3 = 3;
    $scope.answers.question4 = 3;
    $scope.answers.question5 = 3;
    $scope.answers.question6 = 3;
    $scope.answers.question7 = 3;
    $scope.answers.question8 = 3;

    Account.getQuestions().then(function(data){
      $ionicLoading.hide();
      if(Object.getOwnPropertyNames(data.data).length > 0){
       $scope.answers = data.data;
      }
    });


    //On click of button ant the end
    $scope.sendQuestionstoProfile = function(){
      var score = 0;
      $ionicLoading.show({
        template: 'Updating...'
      });
      for(key in $scope.answers) {
        console.log($scope.answers[key]);
          score += parseInt($scope.answers[key]);
      }
      console.log(score);



      window.localStorage.score = score;

      Account.updateQuestions($scope.answers).then(function(){
        $ionicLoading.hide();
        $state.go('app.results');
      });
    };

  })

  .controller('ResultsCtrl', function($scope, $state){

    $scope.privacyScore = window.localStorage.score;
  })

  .controller('AnalysisCtrl', function($scope, $http, $q, Account, UserService, serverUrl, $ionicLoading, $ionicPlatform){
    $ionicLoading.show({
      template: 'Retrieving user data...'
    });
    var fbUserObj = UserService.getUser('facebook');
    console.log(JSON.stringify(fbUserObj.authResponse.accessToken));

    //Parse message data and send to /senitments
    var parseMsgData = function(data){
      var msgData = _(data.data).pluck('message');
      var newArray = new Array();
      for (var i = 0; i < msgData.length; i++) {
        if (msgData[i]) {
          newArray.push(msgData[i]);
        }
      }
      return(newArray);
    };

    //GET request for likes callback function to start graphs
    var getFBfeed = function() {
      facebookConnectPlugin.api('/me/feed?access_token=' + fbUserObj.authResponse.accessToken+'&limit=100', null,
        function (response) {
          console.log('Data retereived');
          console.log(response);
          response = parseMsgData(response);
          $http.post(serverUrl + "/sentiment", response).then(function (sentResponse) {
              console.log(sentResponse.data);
              setChartsData(sentResponse.data);
              Account.updateSentiment(sentResponse.data).then(function(){
                $ionicLoading.hide();
              });
            },
            function (response) {
              $ionicLoading.hide();
              alert('Error');
            }
          );
        });
    };

    var setChartsData = function(data){
      var pos = Math.floor(data.polarity_confidence * 100);
      var neg = 100 - pos;
      $scope.clabels = ['positive','negative'] ;
      $scope.cdata = [ pos, neg] ;
      $scope.sentimentOut = pos;

      var spos = Math.floor(data.subjectivity_confidence * 100);
      var sneg = 100 - spos;
      $scope.slabels = ['Subjective','Objective'];
      $scope.sdata = [spos, sneg];
      $scope.subOut = spos;
    };

    $ionicPlatform.ready(function() {
      getFBfeed();
    });

  })
.controller('StatsCtrl', function($scope, $http, $q, $ionicLoading, $ionicPlatform, UserService, serverUrl, $ionicActionSheet, $state, Account, $window){
  console.log('Parse Big Object');
  console.log(window.localStorage.postStatsObj);
  var postStatsObj = JSON.parse(window.localStorage.postStatsObj);

  $scope.sendlikestoProfile = function(){
    Account.updateLikes(postStatsObj).then(function(){
      $state.go('app.msganalysis');
    });
  };


  if(window.localStorage.catitems!==undefined) {
    var catItems = JSON.parse(window.localStorage.catitems);
    $scope.catitems = catItems;
  }

  if(window.localStorage.genreObj!==undefined){
    var genreObj = JSON.parse(window.localStorage.genreObj);
    $scope.genreObj = genreObj;
  }

  var statsObj = JSON.parse(window.localStorage.stats);
  $scope.labels = statsObj.labels;
  $scope.data = statsObj.data;

  $state.reload();
})


.controller('HomeCtrl', function($scope, $http, $q, $ionicPlatform, UserService, serverUrl, $ionicPopup, $ionicActionSheet, $state, Account, $ionicLoading){

	//This gets user data from local storage depreceated as data is now retrived from remote server **MF**
  //$scope.user = UserService.getUser();
  $ionicLoading.hide();
  $ionicLoading.show({
    template: 'retrieving user data...'
  });


  $scope.getProfile = function() {
    Account.getProfile()
      .then(function(response) {
        $scope.user = response.data;
        $ionicLoading.hide();
      })
      .catch(function(response) {
       alert(response.data.message, response.status);
        $ionicLoading.hide();
        $state.go('welcome.consent');
      });
  };

  $scope.updateProfile = function() {
    $ionicLoading.show({
      template: 'Updating...'
    });
    Account.updateProfile($scope.user)
      .then(function() {
        $ionicLoading.hide();
        $state.go('app.stats');
      })
      .catch(function(response) {
        alert(response.data.message, response.status);
      });
  };


  console.log('changed to home');
  $scope.getProfile();


  //Now retrieve StatsCrtl here, this is done here because of a bug with charts and ionic scroll
  var postStatsObj = {
    likes: {},
    music: {},
    categorys: {}
  };

  //Get user ID from local storage  **MF** Note maybe set as service var maybe not
  var fbUserObj = UserService.getUser('facebook');
  console.log(JSON.stringify(fbUserObj.authResponse.accessToken));

  //GET request for likes callback function to start graphs
  var getFBlikes = function(){

    facebookConnectPlugin.api('/me/likes?fields=name,category,created_time&access_token=' + fbUserObj.authResponse.accessToken+'&suppress_response_codes=true&limit=100', ['email', 'public_profile', 'user_posts', 'user_likes'],
      function (response) {
        console.log('Data retereived');
        console.log(response);
        //Add to main OBJ
        postStatsObj.likes = response.data;
        console.log(postStatsObj);
        parseFBlikeData(response.data);
      },
      function (response) {
        console.log(JSON.stringify(response));
      }
    );
  };



  var parseFBlikeData = function(likeData){
    console.log('parseing');
    console.log(likeData);
    //Parse amount of likes over time
    var timestamps = _(likeData).pluck('created_time');
    timestamps = _(timestamps).chain().groupBy(function(x) {
      return new Date(x.replace("+0000","")).getUTCFullYear();
    }).map(function(y, x) {
      return {
        year: x,
        count: y.length
      }
    }).value();

    /*
    $scope.labels = _(timestamps).pluck('year');
    $scope.data = [_(timestamps).pluck('count')];
    $scope.chartTitle = 'Facebook Likes';
    */
    //Local Storage Now
    window.localStorage.stats = JSON.stringify({
      labels: _(timestamps).pluck('year'),
      data: [_(timestamps).pluck('count')]
    });
    console.log(window.localStorage.stats);

    //Parse category data, second graph here
    var categories = _(likeData).pluck('category');
    categories = _(categories).chain().groupBy(function(x) {
      return x;
    }).map(function(x, y) {
      return {
        cat: y,
        count: x.length
      };
    }).sortBy(function(x) {
      return x.count;

    }).value().reverse().slice(0,10);
    //List Categories

    window.localStorage.catitems = JSON.stringify(categories);

   // $scope.catitems = categories;
    console.log('cat itesms:');
    console.log(categories);
    postStatsObj.categorys = categories;
    //Add Categories to obj


    //Parse music tastes from likes
    var musicians = _(likeData).chain().map(function(x) {
      if(x.category.toLowerCase() == 'musician/band') {
        return x.name.replace(/ \(.*\)/,"");
      }
    }).filter(function(x){ return x }).value();

    var query = [{
      "name|=": musicians,
      "type|=": [
        "/music/artist",
        "/music/musical_group"
      ],
      "/music/artist/genre": []
    }];
    var service_url = 'https://www.googleapis.com/freebase/v1/mqlread';


    $http.jsonp(service_url + '?callback=JSON_CALLBACK&query='+encodeURI(JSON.stringify(query))).success(function(data) {

      var genres = _(data.result).pluck('/music/artist/genre');
      genres = _(genres).flatten();
      var genreObj =[];
      genreObj.genre =[];
      genreObj.value =[];

      //Add this to music


      angular.forEach(genres, function(index,value){
        var v = index;
        console.log(value+index);
        var i = 0;
        angular.forEach(genres, function(index,value){
          if(v === index){
            i++;
          }
        });
        genreObj.push({genre: v, value: i});
      });

      console.log(genreObj);

      window.localStorage.genreObj = JSON.stringify(genreObj);
     // $scope.genreObj = genreObj;
      postStatsObj.music = genreObj;

      console.log(postStatsObj);
      //Send all data to
      window.localStorage.postStatsObj = JSON.stringify(postStatsObj);

    }).error(function(data, status) {
      window.localStorage.postStatsObj = JSON.stringify(postStatsObj);
    })
    ;

  };



  $ionicPlatform.ready(function() {
    getFBlikes();
  });


})

;
