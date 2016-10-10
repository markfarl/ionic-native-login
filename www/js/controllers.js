angular.module('controllers', [])

.controller('WelcomeCtrl', function($ionicPopup, $window, Account, $scope, $http, $state, $q, UserService, $ionicLoading, serverUrl, $ionicScrollDelegate) {

  //Onpage Load clear auth Header as user will be considered logged out if on this page

  //Check if user has logged in
  if(window.localStorage.headerAuth!==undefined && window.localStorage.headerAuth !== ''){
    console.log('logged in');
    $http.defaults.headers.common['Authorization'] = window.localStorage.headerAuth;
    //Later check if questions
    console.log($http.defaults.headers.common['Authorization']);
    console.log(window.localStorage.headerAuth);
    Account.getQuestions().then(function(data){
      if(Object.getOwnPropertyNames(data.data).length > 0){
        window.localStorage.questionData = JSON.stringify(data.data);
        console.log('answersed Check for explicit 1');
        window.localStorage.preferredScore = Math.round(Account.getScore(data)*2.083);
        //check for explicit question
        Account.getExplicitQuestions().then(function(edata){
          console.log(edata);
          $ionicLoading.hide();
          if(edata.data.explicitTotal!==undefined){
            console.log('report seen');
            //save to storage
            window.localStorage.totalExplicit = edata.data.explicitTotal;
            $state.go('app.dashboard');
          }else{
            console.log('report not seen');
            $state.go('results-monkey');
          }
        });
      }else{
        $ionicLoading.hide();
        console.log('not answersed');
        $state.go('slides');
      }
    },
    function(e){
      console.log('auth header error possibly out of date - reset');
   //   $window.localStorage.clear();
   //   $http.defaults.headers.common['Authorization'] = '';
    });
  }else{
    //Logged out clear all
    $window.localStorage.clear();
    $http.defaults.headers.common['Authorization'] = '';
  }
  $scope.changeState = function(state){
    $document[0].body.querySelector('ion-content.grey-background.statistics-page').style[ionic.CSS.TRANSFORM] = 'translate3d(0, 0px, 0)';
    $ionicScrollDelegate.resize();
    $ionicScrollDelegate.scrollTop();
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

    facebookConnectPlugin.api('/me?fields=email,name,age_range,birthday,location,gender,education&access_token=' + authResponse.accessToken, null,
      function (response) {
        console.log('response');
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

        //set it in storage so user remains logged in
        window.localStorage.headerAuth = 'Bearer '+data.token;
        console.log('Auth Header set');
        //Now go to home page

        //CHeck if questions answer
        Account.getQuestions().then(function(data){
          if(Object.getOwnPropertyNames(data.data).length > 0){
            window.localStorage.questionData = JSON.stringify(data.data);
            console.log('answersed Check for explicit 1');
            window.localStorage.preferredScore = Math.round(Account.getScore(data)*2.083);
            //check for explicit question
            Account.getExplicitQuestions().then(function(edata){
              console.log(edata);
              $ionicLoading.hide();
              if(edata.data.explicitTotal!==undefined){
                console.log('report seen');
                //save to storage
                window.localStorage.totalExplicit = edata.data.explicitTotal;
                $state.go('app.dashboard');
              }else{
                console.log('report not seen');
                $state.go('results-monkey');
              }
            });
          }else{
            $ionicLoading.hide();
            console.log('not answersed');
            $state.go('slides');
          }
        });



        //$state.go('app.results-monkey');
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
        facebookConnectPlugin.login(['email', 'public_profile', 'user_posts', 'user_likes', 'user_photos', 'user_events'], fbLoginSuccess, fbLoginError);
      }
    });
  };
})
  .controller('ResultsMonkeyCtrl', function(Account, $scope, $state, $http,  resultsType, $ionicSlideBoxDelegate) {

    window.localStorage.resultsSeen = 'true';
    $http.defaults.headers.common['Authorization'] = window.localStorage.headerAuth;

    //GET RESULTS
    Account.getQuestions().then(function(data){
      window.localStorage.questionData = JSON.stringify(data.data);
      var total = Account.getScore(data);
      var scoreTotal = Math.round(total*2.083);
      window.localStorage.preferredScore = scoreTotal;
      var resultsIndex = 0;
      $scope.Iimpliict_score = scoreTotal;//for precent
      if(total>= 0 && total < 10){
        resultsIndex = 0;
        }else if(total>= 10 && total < 20){
        resultsIndex = 1;
      }else if(total>= 20 && total < 30){
        resultsIndex = 2;
      }else if(total>= 30 && total < 40){
        resultsIndex = 3;
      }else if(total>= 40 && total < 50) {
        resultsIndex = 4;
      }

      $scope.bigfootType = resultsType.result_table[resultsIndex].label;
      $scope.bigfootText = resultsType.result_table[resultsIndex].text;
      $scope.imgsrc = resultsType.result_table[resultsIndex].image;

    });


    $scope.nextPageDashboard = function(){
      $state.go('app.explicit-results');
    };

  })
  .controller('ResultsMonkeyExplicitCtrl', function(Account, Score, UserService, $scope, $state, $http,  $ionicPlatform, $ionicLoading) {

    $http.defaults.headers.common['Authorization'] = window.localStorage.headerAuth;
    var preferredScore = window.localStorage.preferredScore;
    var explicitObj = {};
    var fbUserObj = UserService.getUser('facebook');
    var answeredData = JSON.parse(window.localStorage.questionData);
    console.log('answeredData');
    console.log(answeredData);
    //savefb user to storage
    window.localStorage.userID = fbUserObj.userID;
    console.log(fbUserObj);

    var convertToTime = function(data){
      if(data < 48){
        return 'every <span class="biggerBold">'+Math.round(data)+' hours</span>';
      }else if(data >= 48 && data < 336){
        return 'every <span class="biggerBold">'+Math.round(data/24)+' days</span>';
      }else if(data >= 336 && data < 1440){
        return 'every <span class="biggerBold">'+Math.round(data/24/7)+' weeks</span>';
      }else if(data >= 1440 && data < 8760){
        return 'every <span class="biggerBold">'+Math.round(data/24/7/4)+' months</span>';
      }else if(data >= 8760 && data < 87600){
        return 'every <span class="biggerBold">'+Math.round(data/24/7/52)+' years</span>';
      }else {
        return '<span class="biggerBold">never</span>';
      }
    };
    var getFequ = function(data){
      if(data==4){
        return 'daily';
      }else if(data==3){
        return 'weekly';
      }else if(data==2){
        return 'monthly';
      }else if(data==1){
        return 'less than monthly';
      }else if(data==0 || data == undefined){
        return 'never';
      }
    };
    var outPutPages = function(data){
      console.log('output pages');
      var string = '';
      for(var i in data.raw) {
        string += (i+ '<br> ');
      }
      return string;
    };
    var getLesMore = function(x,i){
      if(x>i){
        return 'This is <span class="biggerBold">more</span> than your';
      }else if(x<i){
        return 'This is <span class="biggerBold">less</span> than your';
      }else if(x==i){
        return 'This is <span class="biggerBold">similar</span> to your';
      }
    };
    $ionicPlatform.ready(function() {
      console.log('start');
      Account.getPostData(fbUserObj.authResponse.accessToken, facebookConnectPlugin).then(function(data){

        var score = Score.getQuestion1(data.data);
        var q3_score = Score.getQuestion3(data.data);
        var q4_score = Score.getQuestion4(data.data);
        var q5_score = Score.getQuestion5(data.data);
       // var q7_score = Score.getQuestion7(data.data);
        var q8_score = Score.getQuestion8(data.data);
        explicitObj.question1 = score;
        explicitObj.question3 = q3_score;
        explicitObj.question4 = q4_score;
        explicitObj.question5 = q5_score;
        //explicitObj.question7 = q7_score;
        explicitObj.question8 = q8_score;

        $scope.question1Summary ='You <span class="biggerBold">post on your wall</span> on average '+convertToTime(score.raw)+'. '+getLesMore(score.score,answeredData.question1)+' specified perceived posting frequency of <span class="biggerBold">'+getFequ(answeredData.question1)+'</span>.';
        $scope.question3Summary ='You <span class="biggerBold">post links on your wall</span> '+convertToTime(q3_score.raw)+'. '+getLesMore(q3_score.score,answeredData.question3)+' specified perceived posting frequency of <span class="biggerBold">'+getFequ(answeredData.question3)+'</span>.';
        $scope.question4Summary ='You <span class="biggerBold">post text only on your wall</span> '+convertToTime(q4_score.raw)+'. '+getLesMore(q4_score.score,answeredData.question4)+' specified perceived posting frequency of <span class="biggerBold">'+getFequ(answeredData.question4)+'</span>.';
        $scope.question5Summary ='You <span class="biggerBold">share friends posts</span> '+convertToTime(q5_score.raw)+'. '+getLesMore(q5_score.score,answeredData.question5)+' specified perceived posting frequency of <span class="biggerBold">'+getFequ(answeredData.question5)+'</span>.';
       // $scope.question7Summary ='You <span class="biggerBold">tag yourself in posts</span> '+convertToTime(q7_score.raw)+'. '+getLesMore(q7_score.score,answeredData.question7)+' specified perceived posting frequency of <span class="biggerBold">'+getFequ(answeredData.question7)+'</span>.';
        $scope.question8Summary ='You <span class="biggerBold">tag your friends in posts</span> '+convertToTime(q8_score.raw)+'. '+getLesMore(q8_score.score,answeredData.question8)+' specified perceived posting frequency of <span class="biggerBold">'+getFequ(answeredData.question8)+'</span>.';


        Account.getPostTaggedData(fbUserObj.authResponse.accessToken, facebookConnectPlugin).then(function(data){
          console.log('tagged posts');
          console.log(data);
          var q2_score = Score.getQuestion2(data);
          var q7_score = Score.getQuestion7(data);
          var q6_score = Score.getQuestion6(data);
          explicitObj.question2 = q2_score;

          explicitObj.question6 = q6_score;
          explicitObj.question7 = q7_score;

          $scope.q6_score ='Your score '+q6_score.score+' your average time is '+q6_score.raw;
          $scope.question2Summary ='You <span class="biggerBold">post tagged images of yourself</span> '+convertToTime(q2_score.raw)+'. '+getLesMore(q2_score.score,answeredData.question2)+' specified perceived posting frequency of <span class="biggerBold">'+getFequ(answeredData.question2)+'</span>.';
          $scope.question6Summary ='You <span class="biggerBold">are tagged in friends posts</span> '+convertToTime(q6_score.raw)+'. '+getLesMore(q6_score.score,answeredData.question6)+' specified perceived posting frequency of <span class="biggerBold">'+getFequ(answeredData.question6)+'</span>.';
          $scope.question7Summary ='You <span class="biggerBold">tag yourself in posts</span> '+convertToTime(q7_score.raw)+'. '+getLesMore(q7_score.score,answeredData.question7)+' specified perceived posting frequency of <span class="biggerBold">'+getFequ(answeredData.question7)+'</span>.';


          Account.getPageLikes(fbUserObj.authResponse.accessToken, facebookConnectPlugin).then(function(data){
            var q9_score = Score.getQuestion9(data.data);
            var q10_score = Score.getQuestion10(data.data);
            explicitObj.question9 = q9_score;
            explicitObj.likepages = q10_score;

            $scope.q9_score ='Your score '+q9_score.score+' your average time is '+q9_score.raw;

            $scope.question9Summary ='You <span class="biggerBold">like pages</span> '+convertToTime(q9_score.raw)+'. '+getLesMore(q9_score.score,answeredData.question9)+' specified perceived posting frequency of <span class="biggerBold">'+getFequ(answeredData.question9)+'</span>.';
            $scope.question10Summary = 'Types of pages you like are <span class="biggerBold"><br>'+outPutPages(q10_score)+'</span>';


            Account.getEventData(fbUserObj.authResponse.accessToken, facebookConnectPlugin).then(function(data){
              var q11_score = Score.getQuestion11(data);
              explicitObj.question10 = q11_score;

              console.log('q11_score');
              console.log(q11_score);
              $scope.question11Summary ='You <span class="biggerBold">attend events</span> '+convertToTime(q11_score.raw)+'. '+getLesMore(q11_score.score,answeredData.question10)+' specified perceived posting frequency of <span class="biggerBold">'+getFequ(answeredData.question10)+'</span>.';


              var totalScores = score.score+q2_score.score+q3_score.score+q4_score.score+q5_score.score+q6_score.score+q7_score.score+q8_score.score+q9_score.score+q10_score.score+q11_score.score;
              var getSocialScore = Account.getSocialScore(answeredData);
              console.log(getSocialScore+ ' Socialscore;');
              totalScores += getSocialScore;
              $scope.totalExplicit = Math.round(totalScores*2.083);
              //store explicit for use in dashboard;
              window.localStorage.totalExplicit = $scope.totalExplicit;
              explicitObj.explicitTotal = $scope.totalExplicit;
              //send explicit results to db
              Account.updateExplicitQuestions(explicitObj);
              $scope.preferredScore = preferredScore;

              var sizedifference = $scope.totalExplicit - preferredScore;
              if (sizedifference>0){
                $scope.sizeDiff = 'This is <span class="biggerBold">'+Math.abs(sizedifference)+'</span> sizes <span class="biggerBold">larger</span> than your';
              }else if(sizedifference<0){
                $scope.sizeDiff = 'This is <span class="biggerBold">'+Math.abs(sizedifference)+'</span> sizes <span class="biggerBold">smaller</span> than your';
              }else if(sizedifference==0){
                $scope.sizeDiff = 'This is <span class="biggerBold">Equal</span> size to your';
              }
              $scope.clabels = ['Actual','Preferred'] ;
              $scope.cdata = [ $scope.totalExplicit, preferredScore] ;


            });
          });
        });
      });
    });

    $scope.nextPageDashboard = function(){
      $state.go('app.dashboard');
    };

  })

  .controller('DashboardCtrl', function($scope,$ionicPopup, Account,  $timeout, $state, $ionicSlideBoxDelegate) {
    $scope.totalExplicit = window.localStorage.totalExplicit;
    $scope.preferredScore = window.localStorage.preferredScore;
    $scope.clabels = ['Actual','Preferred'] ;
    $scope.cdata = [ $scope.totalExplicit, $scope.preferredScore] ;

    $scope.diffPerrcent = Math.abs($scope.totalExplicit - $scope.preferredScore);
    $scope.feedback = {};

    var calltime = function(){
      console.log('get feedback and set');
      $ionicPopup.show({
        template: ''+
        '<div class="form-group">'+
        '<p>I find the app useful</p>' +
        '<label class="item item-input item-select item-stable">'+
        '<div class="input-label">' +
        ''  +
        '</div>'+
        '<select ng-model="feedback.question1">'+
        '<option value="1">Strongly Agree</option>'+
        '<option value="2">Agree</option>'+
        '<option value="3">Disagree</option>'+
        '<option value="4">Strongly Disagree</option>'+
        '</select>'+
        '</label>' +
        '</div>'+
        '<div class="form-group">'+
        '<div class="form-group">'+
        '<p>The App made me more aware of my social media footprint?</p>' +
         '<label class="item item-input item-select item-stable">'+
           '<div class="input-label">' +
            ''  +
          '</div>'+
        '<select ng-model="feedback.question2">'+
          '<option value="1">Strongly Agree</option>'+
        '<option value="2">Agree</option>'+
        '<option value="3">Disagree</option>'+
        '<option value="4">Strongly Disagree</option>'+
        '</select>'+
         '</label>' +
        '</div>'+
        '<div class="form-group">'+
        '<p>I find the app easy to use</p>' +
         '<label class="item item-input item-select item-stable">'+
           '<div class="input-label">' +
            ''  +
          '</div>'+
        '<select ng-model="feedback.question3">'+
          '<option value="1">Strongly Agree</option>'+
        '<option value="2">Agree</option>'+
        '<option value="3">Disagree</option>'+
        '<option value="4">Strongly Disagree</option>'+
        '</select>'+
         '</label>' +
        '</div>'+
        '<p>Other Comments(optional)</p>' +
        '<input ng-model="feedback.question4">',
        title: 'Feedback',
        scope: $scope,
        buttons: [
          { text: 'Cancel' },
          {
            text: '<b>Send</b>',
            type: 'button-positive',
            onTap: function(e) {
              if (!$scope.feedback.question1&&!$scope.feedback.question2) {
                //don't allow the user to close unless he enters shite
                e.preventDefault();
              } else {
                Account.setFeedback($scope.feedback).then(console.log('done'));
              }
            }
          }
        ]
      });
    };
    Account.getFeedback().then(function(data){
      console.log('feedback data');
      console.log(data.data);
      if(Object.keys(data.data).length>0){
        console.log('answered');
      }else{
        console.log('not answered');
        $timeout(calltime, 3000);
      }
    });


  })
  .controller('SlidesCtrl', function($scope, $state, $ionicSlideBoxDelegate, QuestionObjects, $ionicLoading, Account) {

    $scope.answers = {};
    var question11_change;
    $scope.question_11 = function(value){
      question11_change = value;
    };
    // Called to navigate to the main app
    $scope.startApp = function() {
      $state.go('main');
    };
    $scope.next = function() {
      $ionicSlideBoxDelegate.next();
    };
    $scope.previous = function() {
      $ionicSlideBoxDelegate.previous();
    };

    // Called each time the slide changes
    $scope.slideHasChanged = function(index) {
      console.log(index);
      //CHeck for slide 1
      if(index==1){
        if(!checkIfComplete('questionSetOne')){
          alert('fill in the questions first before swipe');
          $ionicSlideBoxDelegate.slide(0)
        }
      }else if(index==2){
        if(!checkIfComplete('questionSetTwo')){
          alert('fill in the questions two before swipe');
          $ionicSlideBoxDelegate.slide(1)
        }
      }
    };

    var sendQuestionstoProfile = function(){
      $ionicLoading.show({
        template: 'Updating...'
      });
      window.localStorage.setupQuestions = JSON.stringify($scope.answers);

      Account.updateQuestions($scope.answers).then(function(){
        $ionicLoading.hide();
      });
    };
    $scope.slideThreeContinue = function(){
      $ionicSlideBoxDelegate.slide(3);
    };
    $scope.changeStateDashboard = function(){
      console.log(question11_change);

      if(question11_change!==undefined){
        //Post off answers
        sendQuestionstoProfile();

        $state.go('results-monkey');
      }else{
        alert('Please answer if we can contact you question!');
      }
    };


    var checkIfComplete = function(model){
      var mymodel = $scope.questionsSet[model].length;
      var continueNext = true;
      for(i=0 ; i < mymodel ; i++){
        console.log($scope.answers[$scope.questionsSet[model][i].model]);
        if($scope.answers[$scope.questionsSet[model][i].model]==undefined){
          continueNext = false;
        }
      }
      return continueNext;
    };


    $scope.slideCheckwhenIput = function(model){
      if(checkIfComplete(model)){
        $ionicSlideBoxDelegate.next();
      }
    };

    $scope.questionsSet = QuestionObjects;


  })


  .controller('AppCtrl', function($scope, Account, $document,UserService, $ionicScrollDelegate, $rootScope, $state, $timeout, $ionicHistory, $window, pageViewed, $ionicPopup, $ionicLoading){

    //Material Design Functions
    // Form data for the login modal
    $scope.loginData = {};
    $scope.isExpanded = false;
    $scope.hasHeaderFabLeft = false;
    $scope.hasHeaderFabRight = false;
    $scope.isTesterAcc = Account.isTesterProfile();
    console.log($scope.isTesterAcc);

    //These values are for hideing navheader and moving subheaer, used by directive scroll-watch
    $rootScope.slideHeader = false;
    $rootScope.slideHeaderPrevious = 0;

    var userDeets = UserService.getUser();
    $scope.userNameMenu = userDeets.name;
    $scope.userImageMenu = userDeets.picture;
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
      //$document[0].body.querySelector('ion-content.grey-background.statistics-page').style[ionic.CSS.TRANSFORM] = 'translate3d(0, 0px, 0)';
      $ionicScrollDelegate.resize();
      $ionicScrollDelegate.scrollTop();
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
        okText: 'Yes',
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
.controller('StatsCtrl', function($scope, Listings, $document, $http, $q, $ionicLoading, $ionicPlatform, UserService, $ionicPopup, serverUrl, $ionicActionSheet, $ionicScrollDelegate, $state, Account, $window){

  var getFBfeed = function() {
    var q = $q.defer();
    $ionicLoading.show({
      template: 'Retrieving facebook data...'
    });
    facebookConnectPlugin.api('/me/feed?fields=likes.limit(1).summary(true),shares,created_time,comments.limit(1).summary(true),message,link,place,picture&access_token=' + fbUserObj.authResponse.accessToken+'&limit=200', null,
      function (response) {
        console.log(response);

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
    function openlink(){
      appAvailability.check(
        'com.facebook.katana',
        function(){
          // facebook is installed
          window.open('fb://photo/'+$scope.likeList[item].picture.split("_")[1], '_system', 'location=no');
        },
        function(){

          // facebook is not installed,
          // then open play store to download and install facebook
          window.open($scope.likeList[item].link, "_blank");
        }
      );
    }
    var button = [];
    var titleText;
    console.log($scope.likeList[item].picture);
    if($scope.likeList[item].picture!=undefined){
      button = [
        {
          text: 'View post',
          type: 'button-block button-positive',
        }
      ];
      titleText = '<img class="popUp-image" src="'+$scope.likeList[item].picture+'"> <span class="biggerBold">'+Listings.checkMessage($scope.likeList[item].message)+'</span> <br>'+Listings.makedate($scope.likeList[item].created_time)+Listings.createDetailsBox($scope.likeList[item]);

    }else{
      button = [];
      titleText= '<span class="biggerBold">'+Listings.checkMessage($scope.likeList[item].message)+'</span> <br>'+Listings.makedate($scope.likeList[item].created_time)+Listings.createDetailsBox($scope.likeList[item])
    }
    // Show the action sheet
    var showActionSheet = $ionicActionSheet.show({
      buttons: button,
      titleText: titleText,
      //     titleText: $scope.likeList[item].message,
      cancelText: 'Cancel',

      cancel: function() {
        // add cancel code...
      },

      buttonClicked: function(index) {
        if(index === 0) {
          openlink();
        }

      },

      destructiveButtonClicked: function() {
        // add delete code..
      }
    });
  };


  var fbUserObj = UserService.getUser('facebook');
  console.log(fbUserObj.picture);

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
      return x.likes.summary.total_count;
    }).value().reverse();
    likeList  = likeList.slice(0,10);
    $scope.likeList = likeList;
    $scope.iconClass = 'ion-thumbsup';
    $scope.filterType = 'Likes';
  };

  var setCommentsList = function(data){
    var likeList = _.filter(data.data, function(num){
      return num.comments.summary.total_count !== undefined;
    });
    likeList = _(likeList).chain().sortBy(function(x) {
      return x.comments.summary.total_count;
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
    $scope.fbProfilePic = fbUserObj.picture;
    if(window.localStorage.fbfeed!==undefined){
      console.log('feed stored');
      fbFeed = JSON.parse(window.localStorage.fbfeed);
      console.log(JSON.stringify(fbFeed));
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

  .controller('FriendStatsCtrl', function($scope, $document, Listings, $http, $q, $ionicLoading, $ionicPlatform, UserService, $ionicPopup, serverUrl, $ionicActionSheet, $ionicScrollDelegate, $state, Account, $window){
    console.log('friends stats');

    var getFBfeed = function() {
      var q = $q.defer();
      $ionicLoading.show({
        template: 'Retrieving facebook data...'
      });
      facebookConnectPlugin.api('/me/photos?fields=likes.limit(1).summary(true),created_time,from,shares,comments.limit(1).summary(true),message,link,place,picture&access_token=' + fbUserObj.authResponse.accessToken+'&limit=200', null,
        function (response) {
          console.log(response);
          //setCommentsList(response);
          $ionicLoading.hide();
          fbFeed = response;
          window.localStorage.fbfeedfriends = JSON.stringify(response);
          return q.resolve();
        });
      return q.promise;
    };

    var fbFeed;

    $scope.sidepopupList = function(item){
      console.log($scope.likeList[item]);
      function openlink(){
        appAvailability.check(
          'com.facebook.katana',
          function(){
            // facebook is installed
            window.open('fb://photo/'+$scope.likeList[item].picture.split("_")[1], '_system', 'location=no');
          },
          function(){

            // facebook is not installed,
            // then open play store to download and install facebook
            window.open($scope.likeList[item].link, "_blank");
          }
        );
      }
      var button = [];
      var titleText;
      console.log($scope.likeList[item].picture);
      if($scope.likeList[item].picture!=undefined){
        button = [
          {
            text: 'View post',
            type: 'button-block button-positive',
          }
        ];
        titleText = '<img class="popUp-image" src="'+$scope.likeList[item].picture+'"> <span class="biggerBold">'+$scope.likeList[item].from.name+'</span> Tagged you<br>'+Listings.makedate($scope.likeList[item].created_time)+Listings.createDetailsBox($scope.likeList[item]);

      }else{
        button = [];
        titleText = '<span class="biggerBold">'+$scope.likeList[item].from.name+'</span> Tagged you<br>'+Listings.makedate($scope.likeList[item].created_time)+Listings.createDetailsBox($scope.likeList[item]);
      }

      // Show the action sheet
      var showActionSheet = $ionicActionSheet.show({
        buttons: [
          {
            text: 'View post',
            type: 'button-block button-positive'
          }
        ],

        titleText:  titleText,
        cancelText: 'Cancel',

        cancel: function() {
          // add cancel code...
        },

        buttonClicked: function(index) {
          if(index === 0) {
            console.log($scope.likeList[item].link);
            openlink();
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
        return x.likes.summary.total_count;
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
        return x.comments.summary.total_count;
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
      if(window.localStorage.fbfeedfriends!==undefined){
        console.log('feed stored');
        fbFeed = JSON.parse(window.localStorage.fbfeedfriends);

        setLikesList(fbFeed);
      }else{
        console.log('feed not stored grab');
        getFBfeed(fbUserObj.authResponse.accessToken).then(function(){
          console.log(JSON.stringify(fbFeed));
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

  .controller('thrdPartyStatsCtrl', function($scope, Listings, $document, $http, $q, $ionicLoading, $ionicPlatform, UserService, $ionicPopup, serverUrl, $ionicActionSheet, $ionicScrollDelegate, $state, Account, $window){
    console.log('Your applications stats');

    var getFBfeed = function() {
      var q = $q.defer();
      $ionicLoading.show({
        template: 'Retrieving facebook data...'
      });
      facebookConnectPlugin.api('/me/events/?fields=picture,declined.limit(1).summary(true),interested.limit(1).summary(true),start_time,name,rsvp_status,attending.limit(1).summary(true)&access_token=' + fbUserObj.authResponse.accessToken+'', null,
        function (response) {
          console.log('events');
          console.log(response);
          //setCommentsList(response);

          fbFeed = response;
          window.localStorage.fbfeedEvents = JSON.stringify(response);
          getFBignored().then(function(){
            $ionicLoading.hide();
            return q.resolve();
          });
        });
      return q.promise;
    };

    var getFBignored = function(){
      var q = $q.defer();
      facebookConnectPlugin.api('/me/events/not_replied/?fields=picture,declined.limit(1).summary(true),interested.limit(1).summary(true),start_time,name,rsvp_status,attending.limit(1).summary(true)&access_token=' + fbUserObj.authResponse.accessToken+'', null,
        function (response) {
          console.log('ignoreSTuff');
          console.log(response);
          //setCommentsList(response);
         //$ionicLoading.hide();
          fbFeedIgnore = response;
          window.localStorage.fbfeedIgnoreEvents = JSON.stringify(response);
          return q.resolve();
        });
      return q.promise;
    };
    var fbFeed,fbFeedIgnore;

    $scope.sidepopupList = function(item){
      console.log($scope.likeList[item]);
      function openlink(){
        appAvailability.check(
          'com.facebook.katana',
          function(){
            // facebook is installed
            window.open('fb://event/'+$scope.likeList[item].id, '_system', 'location=no');
          },
          function(){

            // facebook is not installed,
            // then open play store to download and install facebook
            window.open('https://www.facebook.com/events/'+$scope.likeList[item].id, "_blank");
          }
        );
      }
      // Show the action sheet
      var showActionSheet = $ionicActionSheet.show({
        buttons: [
          {
            text: 'View Event',
            type: 'button-block button-positive',
            onTap: function(e) {
              console.log(e);
            }
          }
        ],
        titleText: '<img class="popUp-image" src="'+$scope.likeList[item].picture.data.url+'"> <span class="biggerBold">'+$scope.likeList[item].name+'</span> <br>'+Listings.makedate($scope.likeList[item].start_time)+Listings.createEventDetailsBox($scope.likeList[item]),
        cancelText: 'Cancel',

        cancel: function() {
          // add cancel code...
        },

        buttonClicked: function(index) {
          if(index === 0) {
            console.log('https://www.facebook.com/events/'+$scope.likeList[item].id);
            openlink();
          }
        },
        destructiveButtonClicked: function() {
          // add delete code..
        }
      });
    };


    var fbUserObj = UserService.getUser('facebook');

    $scope.tabClick = function(filter){
      console.log(filter);
      $scope.tabItem = filter;
      if(filter=='a'){
        setAttendList(fbFeed);
        $document[0].body.querySelector('div#sendSerachTermUp').style[ionic.CSS.TRANSFORM] = 'translate3d(0, 0px, 0)';
        $document[0].body.querySelector('ion-content.grey-background.statistics-page').style[ionic.CSS.TRANSFORM] = 'translate3d(0, 0px, 0)';
        $ionicScrollDelegate.resize();
        $ionicScrollDelegate.scrollTop();
      }else if(filter=='b'){
        setNonAttendList(fbFeedIgnore);
        $document[0].body.querySelector('div#sendSerachTermUp').style[ionic.CSS.TRANSFORM] = 'translate3d(0, 0px, 0)';
        $document[0].body.querySelector('ion-content.grey-background.statistics-page').style[ionic.CSS.TRANSFORM] = 'translate3d(0, 0px, 0)';
        $ionicScrollDelegate.resize();
        $ionicScrollDelegate.scrollTop();
      }else if(filter=='c'){
        setUnsureList(fbFeed);
        $document[0].body.querySelector('div#sendSerachTermUp').style[ionic.CSS.TRANSFORM] = 'translate3d(0, 0px, 0)';
        $document[0].body.querySelector('ion-content.grey-background.statistics-page').style[ionic.CSS.TRANSFORM] = 'translate3d(0, 0px, 0)';
        $ionicScrollDelegate.resize();
        $ionicScrollDelegate.scrollTop();
      }
    };

    var setAttendList = function(data){
      $scope.tabItem = 'a';
      var likeList = _.filter(data.data, function(num){
        return num.rsvp_status == 'attending';
      });
      /*likeList = _(likeList).chain().sortBy(function(x) {
        return x.likes.summary.total_count;
      }).value().reverse();
      likeList  = likeList.slice(0,10);*/
      $scope.likeList = likeList;
      $scope.iconClass = 'ion-thumbsup';
      $scope.filterType = 'Attended/Attending';
    };



    var setNonAttendList = function(data){

      /*likeList = _(likeList).chain().sortBy(function(x) {
       return x.likes.summary.total_count;
       }).value().reverse();
       likeList  = likeList.slice(0,10);*/
      $scope.likeList = data.data;
      $scope.iconClass = 'ion-thumbsup';
      $scope.filterType = 'Ignored';
    };


    var setUnsureList = function(data){
      var likeList = _.filter(data.data, function(num){
        return num.rsvp_status == 'unsure';
      });
      $scope.likeList = likeList;
      $scope.iconClass = 'ion-thumbsup';
      $scope.filterType = 'Replyed Unsure';
    };


    $ionicPlatform.ready(function() {
      if(window.localStorage.fbfeedEvents!==undefined && window.localStorage.fbfeedIgnoreEvents!==undefined){
        console.log('feed stored');
        fbFeed = JSON.parse(window.localStorage.fbfeedEvents);
        fbFeedIgnore = JSON.parse(window.localStorage.fbfeedIgnoreEvents);
        console.log(JSON.stringify(fbFeed));
        setAttendList(fbFeed);
      }else{
        console.log('feed not stored grab');
        getFBfeed(fbUserObj.authResponse.accessToken).then(function(){
          console.log('start list');
          setAttendList(fbFeed);
        });
      }
    });

  })

  .controller('pageLikesStatsCtrl', function($scope, Listings, $document, $http, $q, $ionicLoading, $ionicPlatform, UserService, $ionicPopup, serverUrl, $ionicActionSheet, $ionicScrollDelegate, $state, Account, $window){
    console.log('Your page likes stats');

    var getFBfeed = function() {
      var q = $q.defer();
      $ionicLoading.show({
        template: 'Retrieving facebook data...'
      });
     // facebookConnectPlugin.api('/me/likes?fields=name,category,created_time&access_token=' + access+'&suppress_response_codes=true&limit=100', ['email', 'public_profile', 'user_posts', 'user_likes'],
      facebookConnectPlugin.api('me/likes?fields=name,picture,likes,category,created_time&access_token='+fbUserObj.authResponse.accessToken+'&suppress_response_codes=true&limit=100', null,
        function (response) {
          console.log('events');
          console.log(response);
          fbFeed = response;

          $ionicLoading.hide();
          return q.resolve();

        });
      return q.promise;
    };


    var fbFeed,fbFeedIgnore;

    $scope.sidepopupList = function(item){
      console.log($scope.likeList[item]);
      function openlink(){
        window.open('https://www.facebook.com/events/'+$scope.likeList[item].id, "_blank");
      }
      // Show the action sheet
      var showActionSheet = $ionicActionSheet.show({
        buttons: [
          {
            text: 'View post',
            type: 'button-block button-positive',
            onTap: function(e) {
              console.log(e);
            }
          }
        ],
        titleText: '<img class="popUp-image" src="'+$scope.likeList[item].picture.data.url+'"> <span class="biggerBold">'+$scope.likeList[item].name+'</span> <br>'+Listings.makedate($scope.likeList[item].start_time)+Listings.createEventDetailsBox($scope.likeList[item]),
        cancelText: 'Cancel',

        cancel: function() {
          // add cancel code...
        },

        buttonClicked: function(index) {
          if(index === 0) {
            console.log('https://www.facebook.com/events/'+$scope.likeList[item].id);
            openlink();
          }
        },
        destructiveButtonClicked: function() {
          // add delete code..
        }
      });
    };


    var fbUserObj = UserService.getUser('facebook');

    $scope.tabClick = function(filter){
      console.log(filter);
      $scope.tabItem = filter;
      if(filter=='a'){
        setPopList(fbFeed);
        $document[0].body.querySelector('div#sendSerachTermUp').style[ionic.CSS.TRANSFORM] = 'translate3d(0, 0px, 0)';
        $document[0].body.querySelector('ion-content.grey-background.statistics-page').style[ionic.CSS.TRANSFORM] = 'translate3d(0, 0px, 0)';
        $ionicScrollDelegate.resize();
        $ionicScrollDelegate.scrollTop();
      }else if(filter=='b'){
        catLists(fbFeed);
        $document[0].body.querySelector('div#sendSerachTermUp').style[ionic.CSS.TRANSFORM] = 'translate3d(0, 0px, 0)';
        $document[0].body.querySelector('ion-content.grey-background.statistics-page').style[ionic.CSS.TRANSFORM] = 'translate3d(0, 0px, 0)';
        $ionicScrollDelegate.resize();
        $ionicScrollDelegate.scrollTop();
      }
    };

    var catLists = function(data){
      $scope.tabItem = 'a';
      var listObj = [];
      var list =  _(data.data).pluck('category');
      for(var i in list){
        if(listObj.length>0){
          var createNew = false;
          for(x in listObj){
            if(listObj[x].name == list[i]){
              console.log('add'+list[i]);
              listObj[x].amount += 1;
              createNew = true;
            }
          }
          if(createNew==false){
            console.log('create new'+list[i]);
            listObj.push({
              name: list[i],
              amount: 1
            });
          }
        }else{
          listObj.push({
            name: list[i],
            amount: 1
          });
        }
      }
      listObj = _(listObj).chain().sortBy(function(x) {
        return x.amount;
      }).value().reverse();
      listObj  = listObj.slice(0,20);
      console.log(listObj);
      $scope.tabItem = 'b';
      $scope.likeList = listObj;
      $scope.likeListPop = [];
      $scope.iconClass = 'ion-thumbsup';
      $scope.filterType = 'category';
    };


    var setPopList = function(data){

      //var newList = _(data.data).sortBy('likes').value().reverse().slice(0,10);
      var newList = _(data.data).chain().sortBy(function(x) {
        return x.likes;
      }).value().reverse();
      newList  = newList.slice(0,20);
      console.log(newList);
      $scope.tabItem = 'a';
      $scope.likeList = [];
      $scope.likeListPop = newList;
      $scope.iconClass = 'ion-thumbsup';
      $scope.filterType = 'most popular';
    };


    $ionicPlatform.ready(function() {
      if(window.localStorage.fblikePages!==undefined){
        console.log('feed stored');
        fbFeed = JSON.parse(window.localStorage.fblikePages);
        console.log(JSON.stringify(fbFeed));
        setPopList(fbFeed);
      }else{
        console.log('feed not stored grab');
        getFBfeed(fbUserObj.authResponse.accessToken).then(function(){
          console.log('start list');
          setPopList(fbFeed);
        });
      }
    });

  })

  .controller('FootprintCtrl', function($scope, Account, $http, $q, pageViewed, UserService, $ionicLoading, $ionicPopup, $ionicScrollDelegate, $state){

    var questionsAnswered = false;
    $scope.answers = {};
    //$scope.ngFootprintIncludeUrl = 'views/questions-footprint.html';

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

    $scope.tabClick = function(filter){
      console.log(filter);
      $scope.tabItem = filter;
      if(filter=='a'){
        $scope.ngFootprintIncludeUrl = 'views/questions-footprint.html';
        $ionicScrollDelegate.resize();
        $ionicScrollDelegate.scrollTop();
      }else if(filter=='b'){
        if(questionsAnswered){
          $scope.ngFootprintIncludeUrl = 'views/analysis-footprint.html';
          $ionicScrollDelegate.resize();
          $ionicScrollDelegate.scrollTop();
        }else{
          var alertPopup = $ionicPopup.alert({
            title: 'Information',
            template: 'You must anwser each question.'
          });
        }

      }else if(filter=='c'){
        if(questionsAnswered) {
          $scope.ngFootprintIncludeUrl = 'views/recommend-footprint.html';
          $ionicScrollDelegate.resize();
          $ionicScrollDelegate.scrollTop();
        }else{
          var alertPopup = $ionicPopup.alert({
            title: 'Information',
            template: 'You must anwser each question.'
          });
        }
      }
    };

    Account.getQuestions().then(function(data){
      $ionicLoading.hide();
      if(Object.getOwnPropertyNames(data.data).length > 0){
        $scope.answers = data.data;
        questionsAnswered = true;
        console.log('answersed');
        $scope.ngFootprintIncludeUrl = 'views/analysis-footprint.html';
      }else{
        console.log('hide answers');
        $scope.ngFootprintIncludeUrl = 'views/analysis-footprint.html';
      }
    });

    var showquestions = function(){
      $ionicLoading.show({
        template: 'retrieving user data...'
      });

    };





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
      window.localStorage.score = score;
      Account.updateQuestions($scope.answers).then(function(){
        pageViewed.questions = 1;
        $ionicLoading.hide();
        questionsAnswered = true;
        $scope.ngFootprintIncludeUrl = 'views/analysis-footprint.html';
      });
    };

  })

  .controller('HomeCtrl', function($scope, QuestionObjects, pageViewed, $http, $q, $timeout, $ionicPlatform, UserService, serverUrl, $ionicPopup, $ionicActionSheet, $state, Account, $ionicLoading, ionicMaterialMotion, ionicMaterialInk){
	//This gets user data from local storage depreceated as data is now retrived from remote server **MF**
  //$scope.user = UserService.getUser();
  //  $scope.answers = {};
    if(window.localStorage.headerAuth!==undefined && window.localStorage.headerAuth !== '') {
      console.log('logged in');
      //user is logged in, send them to dashboard
      $http.defaults.headers.common['Authorization'] = window.localStorage.headerAuth;
      //Later check if questions
      console.log($http.defaults.headers.common['Authorization']);

    }
    $scope.sendQuestionstoProfile = function(){
      console.log('ass');
      $ionicLoading.show({
        template: 'Updating...'
      });
      window.localStorage.setupQuestions = JSON.stringify($scope.answers);

      Account.updateQuestions($scope.answers).then(function(){
        $ionicLoading.hide();
        alert('Answers updated');
      });
    };
  $scope.questionsSet = QuestionObjects;
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
        Account.getQuestions().then(function(data){
          $ionicLoading.hide();
          if(Object.getOwnPropertyNames(data.data).length > 0){
            console.log(data.data);
            $scope.answers = data.data;
            console.log(data.data);
            console.log($scope.answers);
            console.log('answersed');

          }else{
            console.log('hide answers');
          }
        });
        //$ionicLoading.hide();

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

        parseFBlikeData(response.data);
      },
      function (response) {
       // console.log(JSON.stringify(response));
      }
    );
  };



  var parseFBlikeData = function(likeData){
    console.log('parseing');
    console.log(JSON.stringify(likeData));
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
   // console.log(categories);
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

    //  console.log(genreObj);

      window.localStorage.genreObj = JSON.stringify(genreObj);
     // $scope.genreObj = genreObj;
      postStatsObj.music = genreObj;

    //  console.log(postStatsObj);
      //Send all data to
      window.localStorage.postStatsObj = JSON.stringify(postStatsObj);

    }).error(function(data, status) {
      window.localStorage.postStatsObj = JSON.stringify(postStatsObj);
    })
    ;

  };

    var showSetupPopup = false;
    var anserSetupObj = [];
    var setupQuestion = function(i){
      i++;
      var template = 'question'+i+'.html';
      console.log(template);
      if(i<5){
        setTimeout(function(){
          showSetupFunction(template,i);
        },90);
      }else if(i==5){
$state.go('app.footprint');
      }
    };
    var showSetupFunction = function(templateUrl, i){
      var popup = $ionicPopup.show({
        templateUrl: templateUrl,
        title: 'Setup Wizard',
        scope: $scope,
        buttons: [
          {
            text: '<b>Next</b>',
            type: 'button-positive',
            onTap: function(e) {
              closebutton(i);
            }
          }
        ]
      });

      var closebutton = function(i){
        popup.close();
        console.log($scope.choice);
        anserSetupObj[i] = $scope.choice;
        $scope.choice = '';
        setupQuestion(i);
      }
    };

  if(window.localStorage.setupComplete!==undefined){
    showSetupPopup = true;
  }
  $ionicPlatform.ready(function() {
    getFBlikes();
    if(showSetupPopup){
      showSetupFunction('question1.html',1);
    }
  });


  // Set Motion **Wrap this around a listenter fro profile pic load**

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

