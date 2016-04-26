angular.module('controllers', [])

.controller('WelcomeCtrl', function($ionicPopup, $scope, $http, $state, $q, UserService, $ionicLoading, serverUrl, $ionicScrollDelegate) {

  //Onpage Load clear auth Header as user will be considered logged out if on this page
  $http.defaults.headers.common['Authorization'] = '';


  $scope.changeState = function(state){
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

  $scope.scrolltoBottom = function(){
    $ionicScrollDelegate.scrollBottom(true);
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




  .controller('AppCtrl', function($scope, $document, $ionicScrollDelegate, $rootScope, $state, $timeout, $ionicHistory, $window, pageViewed, $ionicPopup, $ionicLoading){

    //Material Design Functions
    // Form data for the login modal
    $scope.loginData = {};
    $scope.isExpanded = false;
    $scope.hasHeaderFabLeft = false;
    $scope.hasHeaderFabRight = false;

    //These values are for hideing navheader and moving subheaer, used by directive scroll-watch
    $rootScope.slideHeader = false;
    $rootScope.slideHeaderPrevious = 0;


    //Url here is gotten from ng-click
    $scope.changeStateUrl = function(stateUrl){

      $scope.ngIncludeUrlState = stateUrl;
      $scope.ngIncludeUrl = 'views/'+stateUrl+'.html';
      $ionicScrollDelegate.resize();
      $ionicScrollDelegate.scrollTop();

    };
    //DefaULT uRL stATE
    $scope.ngIncludeUrl = 'views/mydetails.html';
    $scope.ngIncludeUrlState = 'mydetails';

    $scope.sendSerachTermUp = function(){
      $document[0].body.querySelector('div#sendSerachTermUp').style[ionic.CSS.TRANSFORM] = 'translate3d(0, -50px, 0)';
      $document[0].body.querySelector('ion-content.grey-background.statistics-page').style[ionic.CSS.TRANSFORM] = 'translate3d(0, -40px, 0)';
    };





    /*var navIcons = document.getElementsByClassName('ion-navicon');

    for (var i = 0; i < navIcons.length; i++) {
      navIcons.addEventListener('click', function() {
        this.classList.toggle('active');
      });
    }*/

    ////////////////////////////////////////
    // Layout Methods
    ////////////////////////////////////////

    $scope.hideNavBar = function() {
      document.getElementsByTagName('ion-nav-bar')[0].style.display = 'none';
    };

    $scope.showNavBar = function() {
      document.getElementsByTagName('ion-nav-bar')[0].style.display = 'block';
    };

    $scope.noHeader = function() {
      var content = document.getElementsByTagName('ion-content');
      for (var i = 0; i < content.length; i++) {
        if (content[i].classList.contains('has-header')) {
          content[i].classList.toggle('has-header');
        }
      }
    };

    $scope.setExpanded = function(bool) {
      $scope.isExpanded = bool;
    };

    $scope.setHeaderFab = function(location) {
      var hasHeaderFabLeft = false;
      var hasHeaderFabRight = false;

      switch (location) {
        case 'left':
          hasHeaderFabLeft = true;
          break;
        case 'right':
          hasHeaderFabRight = true;
          break;
      }

      $scope.hasHeaderFabLeft = hasHeaderFabLeft;
      $scope.hasHeaderFabRight = hasHeaderFabRight;
    };

    $scope.hasHeader = function() {
      var content = document.getElementsByTagName('ion-content');
      for (var i = 0; i < content.length; i++) {
        if (!content[i].classList.contains('has-header')) {
          content[i].classList.toggle('has-header');
        }
      }

    };

    $scope.hideHeader = function() {
      $scope.hideNavBar();
      $scope.noHeader();
    };

    $scope.showHeader = function() {
      $scope.showNavBar();
      $scope.hasHeader();
    };

    $scope.clearFabs = function() {
      var fabs = document.getElementsByClassName('button-fab');
      if (fabs.length && fabs.length > 1) {
        fabs[0].remove();
      }
    };
    //End of Material Design Functions

    $scope.pageViewed = pageViewed;

    $scope.changeState = function(state){
      console.log(state);
      $state.go(state);
    };

    var logOutProcess = function(){
      pageViewed.stats = 0;
      pageViewed.messageAnal = 0;
      pageViewed.questions = 0;
      $timeout(function () {
        $window.localStorage.clear();
        $ionicHistory.clearCache();
        $ionicHistory.clearHistory();
        $ionicLoading.hide();
        $state.go('welcome.terms');
      },300);
    };

    $scope.LogOutProcess = logOutProcess;

    $scope.showInformationPopup = function(){
      var alertPopup = $ionicPopup.alert({
        title: 'Information',
        template: 'Each question is optional. Feel free to omit a response to any question; however the researcher would be grateful if all questions are responded to.'
      });


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
          facebookConnectPlugin.logout(logOutProcess,
            function(fail){
              $ionicLoading.hide();
            });
        }
      });

    };


  })
  .controller('QuestionsCtrl', function($scope, Account, $http, $q, pageViewed, UserService, $ionicLoading, $ionicPlatform, $state){
    //Question Object
    $scope.answers = {};
    console.log(pageViewed);
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
        },
      {
        title: "I don't mind that most Social Media sites use my data to sell advertisement.",
        model: 'question9',
        items: {
          'Strongly Disagree': 1,
          'Disagree': 2,
          'Neutral': 3,
          'Agree': 4,
          'Strongly Agree': 5
        }
        },
      {
        title: 'I would rather pay Social Media sites a subscription fee in exchange for controlling what happens with my data.',
        model: 'question10',
        items: {
          'Strongly Disagree': 5,
          'Disagree': 4,
          'Neutral': 3,
          'Agree': 2,
          'Strongly Agree': 1
        }
        },
      {
        title: 'I would like to be able to sell my Social Media data to private organizations such as Advertising and Marketing agencies.',
        model: 'question11',
        items: {
          'Strongly Disagree': 1,
          'Disagree': 2,
          'Neutral': 3,
          'Agree': 4,
          'Strongly Agree': 5
        }
        },
      {
        title: 'For what price would you sell all your Social Media data?',
        model: 'question12',
        items: {
          'I would not sell': 5,
          'No more than €10': 4,
          'No more than €100': 3,
          'No more than €500': 2,
          'More than €500': 1

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
    $scope.answers.question9 = 3;
    $scope.answers.question10 = 3;
    $scope.answers.question11 = 3;
    $scope.answers.question12 = 3;

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
        pageViewed.questions = 1;
        $ionicLoading.hide();
        $state.go('app.results');
      });
    };

  })

  .controller('ResultsCtrl', function($scope, $state){

    $scope.privacyScore = window.localStorage.score;


    var result_table = [
      {
        label: "Actual bigfoot (A)",
        text: "Are you hairy? It's because I can't see you. You use social media seldom and are very careful with posting private information. With this usage you might miss out or not know about what social media can do for yourself and business promotion.",
        image: "newA.png"
      },
      {
        label: "Orang-Utan (B)",
        text: "It’s a small print, but it’s leaving its tracks. You don’t seem to use social media on a regular base and you seem to be aware of how it works and what impact it has. You might have a tendency to not actively participate in social media by using it as a general information tool.",
        image: "newB.png"
      },
      {
        label: "Apeman (C)",
        text: "Apeman: Evolving and getting better, but not quite there yet. You tend to use social media quite often, but are pretty cautious what you put up on the web. However, you might let your guard down every once in a while.",
        image: "newC.png"
      },
      {
        label: "Silverback gorilla (D)",
        text: "Please do not crush me with your huge feet! You tend to use social media at least once a day and you are actively engaged with it. Once in a while you think about what personal information might not be smart to put up on the web, but it’s not like you care that often.",
        image: "newD.png"
      },
      {
        label: "King-kong (E)",
        text: "Will you look at the size of that thing? You almost crushed that guy’s house! You use social media quite a few times every day and are actively engaged with it. You don’t really seem care about what happens with your data.",
        image: "newE.png"
      }
    ];
    var result_index = 0;
    if (window.localStorage.score > 48 && window.localStorage.score <= 60) {
      result_index = 4;
    } else if (window.localStorage.score > 36 && window.localStorage.score <= 48) {
      result_index = 3;
    } else if (window.localStorage.score > 25 && window.localStorage.score <= 36) {
      result_index = 2;
    } else if (window.localStorage.score > 13 && window.localStorage.score <= 25) {
      result_index = 1;
    }

    $scope.scoreTitle = result_table[result_index].label;
    $scope.scoreText = result_table[result_index].text;
    $scope.scoreimage = result_table[result_index].image;

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
.controller('StatsCtrl', function($scope, $document, $http, $q, $ionicLoading, $ionicPlatform, UserService, $ionicPopup, serverUrl, $ionicActionSheet, $ionicScrollDelegate, $state, Account, $window){
  console.log('stats');

  var getFBfeed = function() {
    var q = $q.defer();
    $ionicLoading.show({
      template: 'Retrieving facebook data...'
    });
    facebookConnectPlugin.api('/me/feed?fields=likes,shares,comments,message,link,place,picture&access_token=' + fbUserObj.authResponse.accessToken+'&limit=200', null,
      function (response) {
        console.log(response);
        //setCommentsList(response);
        $ionicLoading.hide();
        fbFeed = response;
        window.localStorage.fbfeed = JSON.stringify(response);
        return q.resolve();
      });
    return q.promise;
  };

  var fbFeed;

  $scope.sidepopupList = function(item){
    console.log($scope.likeList[item]);
    // Show the action sheet
    var showActionSheet = $ionicActionSheet.show({
        buttons: [
      {
        text: 'Share this post',
        type: 'button-block button-positive',
        onTap: function(e) {
          console.log(e);
        }
      },
      {
        text: 'View post',
        type: 'button-block button-positive',
        onTap: function(e) {
          console.log(e);
        }
      }
    ],
      titleText: $scope.likeList[item].message,
      cancelText: 'Cancel',

      cancel: function() {
        // add cancel code...
      },

      buttonClicked: function(index) {
        if(index === 0) {
          // add edit 1 code
        }

        if(index === 1) {
          // add edit 2 code
        }
      },

      destructiveButtonClicked: function() {
        // add delete code..
      }
    });
  };


  var fbUserObj = UserService.getUser('facebook');

  $scope.tabClick = function(filter){
    console.log(filter)
    $scope.tabItem = filter;
    if(filter=='a'){
      setLikesList(fbFeed);
      $document[0].body.querySelector('div#sendSerachTermUp').style[ionic.CSS.TRANSFORM] = 'translate3d(0, 0px, 0)';
      $document[0].body.querySelector('ion-content.grey-background.statistics-page').style[ionic.CSS.TRANSFORM] = 'translate3d(0, 0px, 0)';
      $ionicScrollDelegate.resize();
      $ionicScrollDelegate.scrollTop();
    }else if(filter=='b'){
      setCommentsList(fbFeed);
      $document[0].body.querySelector('div#sendSerachTermUp').style[ionic.CSS.TRANSFORM] = 'translate3d(0, 0px, 0)';
      $document[0].body.querySelector('ion-content.grey-background.statistics-page').style[ionic.CSS.TRANSFORM] = 'translate3d(0, 0px, 0)';
      $ionicScrollDelegate.resize();
      $ionicScrollDelegate.scrollTop();
    }else if(filter=='c'){
      setShareList(fbFeed);
      $document[0].body.querySelector('div#sendSerachTermUp').style[ionic.CSS.TRANSFORM] = 'translate3d(0, 0px, 0)';
      $document[0].body.querySelector('ion-content.grey-background.statistics-page').style[ionic.CSS.TRANSFORM] = 'translate3d(0, 0px, 0)';
      $ionicScrollDelegate.resize();
      $ionicScrollDelegate.scrollTop();
    }
  };

  var setLikesList = function(data){
   $scope.tabItem = 'a';
   var likeList = _.filter(data.data, function(num){
     return num.likes !== undefined;
   });
   likeList = _(likeList).chain().sortBy(function(x) {
      return x.likes.data.length;
    }).value().reverse();
    likeList  = likeList.slice(0,10);
    $scope.likeList = likeList;
    $scope.iconClass = 'ion-thumbsup';
    $scope.filterType = 'Likes';
  };



  var setCommentsList = function(data){
    var likeList = _.filter(data.data, function(num){
      return num.comments !== undefined;
    });
    likeList = _(likeList).chain().sortBy(function(x) {
      return x.comments.data.length;
    }).value().reverse();
    likeList  = likeList.slice(0,10);

    $scope.likeList = likeList;
    $scope.iconClass = 'ion-chatboxes';
    $scope.filterType = 'Comments';
  };

  var setShareList = function(data){
    console.log(data);
    var likeList = _.filter(data.data, function(num){
      return num.shares !== undefined;
    });
    likeList = _(likeList).chain().sortBy(function(x) {
      return x.shares.count;
    }).value().reverse();
    likeList  = likeList.slice(0,10);

    $scope.likeList = likeList;
    $scope.iconClass = 'ion-android-share-alt';
    $scope.filterType = 'Shares';
  };


  $ionicPlatform.ready(function() {
    if(window.localStorage.fbfeed!==undefined){
      console.log('feed stored');
      fbFeed = JSON.parse(window.localStorage.fbfeed);
      console.log(fbFeed);
      setLikesList(fbFeed);
    }else{
      console.log('feed not stored grab');
      getFBfeed(fbUserObj.authResponse.accessToken).then(function(){
        console.log('start list');
        setLikesList(fbFeed);
      });
    }
  });

  /* console.log('Parse Big Object');
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
 */
})


.controller('HomeCtrl', function($scope, pageViewed, $http, $q, $timeout, $ionicPlatform, UserService, serverUrl, $ionicPopup, $ionicActionSheet, $state, Account, $ionicLoading, ionicMaterialMotion, ionicMaterialInk){
	//This gets user data from local storage depreceated as data is now retrived from remote server **MF**
  //$scope.user = UserService.getUser();
  $ionicLoading.hide();
  $ionicLoading.show({
    template: 'retrieving user data...'
  });
  $scope.$parent.showHeader();
  $scope.$parent.clearFabs();
  $scope.isExpanded = false;
  $scope.$parent.setExpanded(false);
  $scope.$parent.setHeaderFab(false);

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
        pageViewed.messageAnal = 1;
        pageViewed.stats = 1;
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

  // Set Motion **Wrap this around a listenter fro profile pic load**
  console.log('motion started')
  $timeout(function() {
    ionicMaterialMotion.slideUp({
      selector: '.slide-up'
    });
  }, 300);

  $timeout(function() {
    ionicMaterialMotion.fadeSlideInRight({
      startVelocity: 3000
    });
  }, 700);


}).directive('headerShrink', function($document) {
  var fadeAmt,logoAmount;

  var shrink = function(header, content, amt, max, imgLogo, disapearItems) {
    amt = Math.min(190, amt);
    fadeAmt =  amt / 75;
    logoAmount = (amt - 90)/170 * 10;
    shrinkAmt = logoAmount/20 +0.5;
    shrinkAmt = 1.4 - shrinkAmt;
    logoAmount = logoAmount*3.7;
    ionic.requestAnimationFrame(function() {
      header.style[ionic.CSS.TRANSFORM] = 'translate3d(0, -' + amt + 'px, 0)';

      imgLogo.style[ionic.CSS.TRANSFORM] = 'translate3d(0, -' + logoAmount + 'px, 0) scale3d('+shrinkAmt+','+shrinkAmt+',1) ';

      disapearItems.style.opacity = fadeAmt;

    });
  };

  return {
    restrict: 'A',
    link: function($scope, $element, $attr) {
      var starty = $scope.$eval($attr.headerShrink) || 0;
      var shrinkAmt;

      var header = $document[0].body.querySelector('.bar-header');
      var imgLogo = $document[0].body.querySelector('img.logo');
      var disapearItems = $document[0].body.querySelector('div.dissapearBlue');
      var hideScrollBtn = $document[0].body.querySelector('button.hideScrollBtn');

      var headerHeight = header.offsetHeight;

      $element.bind('scroll', function(e) {
        var scrollTop = null;
        var scrollBottom = null;
        var inversePadding = 185; //This value is to offset the css margin-bottom value on .front-page
        if(e.detail){
          scrollTop = e.detail.scrollTop;
          scrollBottom = e.target.offsetHeight - (e.target.scrollHeight - e.detail.scrollTop) - inversePadding;
        }else if(e.target){
          scrollTop = e.target.scrollTop;
          scrollBottom = e.target.scrollHeight - e.target.offsetHeight - e.target.scrollTop - inversePadding;
        }

        if(scrollBottom < -200){
          hideScrollBtn.style.opacity = 1;
        }else if(scrollBottom > -199){
          hideScrollBtn.style.opacity = 0;
        }
        if(scrollTop > starty){
          // Start shrinking
          shrinkAmt = headerHeight - Math.max(0, (starty + headerHeight) - scrollTop);
          shrink(header, $element[0], shrinkAmt, headerHeight, imgLogo, disapearItems);
        } else {
          shrink(header, $element[0], 0, headerHeight, imgLogo, disapearItems);
        }
      });
    }
  }
})
  .directive('profileHeaderShrink', function($document) {
    var fadeAmt,logoAmount;
    var shrink = function(header, content, amt, max, imgLogo, userDetails) {
      //samt = Math.min(100, amt);
      amt = Math.min(196, amt);
      samt = (amt / 110) * 75;
      fadeAmt = 1 - amt / 50;
      ionic.requestAnimationFrame(function () {
        header.style[ionic.CSS.TRANSFORM] = 'translate3d(0, -' + amt + 'px, 0)';
        imgLogo.style[ionic.CSS.TRANSFORM] = 'translate3d(0, ' + samt + 'px, 0)';
        userDetails.style.opacity = fadeAmt;
      });
    };
    return {
      restrict: 'A',
      link: function($scope, $element, $attr) {
        var starty = $scope.$eval($attr.headerShrink) || 0;
        var shrinkAmt;

        var header = $document[0].body.querySelector('.profile-header-content');

        var imgLogo = $document[0].body.querySelector('div#imglogo');

        var userDetails =  $document[0].body.querySelector('.user-details');

        var headerHeight = header.offsetHeight;

        $element.bind('scroll', function(e) {
          var scrollTop = null;
          var scrollBottom = null;
          var inversePadding = 185; //This value is to offset the css margin-bottom value on .front-page
          if(e.detail){
            scrollTop = e.detail.scrollTop;
            scrollBottom = e.target.offsetHeight - (e.target.scrollHeight - e.detail.scrollTop) - inversePadding;
          }else if(e.target){
            scrollTop = e.target.scrollTop;
            scrollBottom = e.target.scrollHeight - e.target.offsetHeight - e.target.scrollTop - inversePadding;
          }

          if(scrollTop > starty){
            // Start shrinking
            shrinkAmt = headerHeight - Math.max(0, (starty + headerHeight) - scrollTop);
            shrink(header, $element[0], shrinkAmt, headerHeight, imgLogo, userDetails);
          } else {
            shrink(header, $element[0], 0, headerHeight, imgLogo, userDetails);
          }
        });
      }
    }
  })
  .directive('scrollWatch', function($rootScope) {
    return function(scope, elem, attr) {
      var threshold = attr.scrollWatch;
      elem.bind('scroll', function(e) {
        if(e.detail.scrollTop > threshold && $rootScope.slideHeaderPrevious !== e.detail.scrollTop) {
          $rootScope.slideHeader = true;
        } else if($rootScope.slideHeaderPrevious !== e.detail.scrollTop){
          //shopw head
          $rootScope.slideHeader = false;
        }
        if ($rootScope.slideHeaderPrevious > e.detail.scrollTop){
          //Show head
          $rootScope.slideHeader = false;
        }
        $rootScope.slideHeaderPrevious = e.detail.scrollTop;

        $rootScope.$apply();
      });
    };
  });

