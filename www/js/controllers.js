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




  .controller('AppCtrl', function(){

  })
.controller('StatsCtrl', function($scope, $http, $q, UserService, serverUrl, $ionicActionSheet, $state, Account, $ionicLoading){
  //Get user ID from local storage  **MF** Note maybe set as service var maybe not
  var fbUserObj = UserService.getUser('facebook');
  console.log(JSON.stringify(fbUserObj.authResponse.accessToken));

  //GET request for likes callback function to start graphs
  var getFBlikes = function(){

    facebookConnectPlugin.api('/me/likes?fields=name,category,created_time&access_token=' + fbUserObj.authResponse.accessToken+'&suppress_response_codes=true', ['email', 'public_profile', 'user_posts', 'user_likes'],
      function (response) {
        console.log('Data retereived');
        console.log(response);
        parseFBlikeData(response.data);
      },
      function (response) {
        console.log(JSON.stringify(response));
      }
    );
  };

  //GET request for facebook messages
  var getFBfeed = function(){
    facebookConnectPlugin.api('/me?fields=likes,name&access_token=' + fbUserObj.authResponse.accessToken+'&suppress_response_codes=true', null,
      function (response) {
        console.log('Data retereived');
        parseFBlikeData(response);
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

    $scope.labels = _(timestamps).pluck('year');
    $scope.data = [_(timestamps).pluck('count')];
    $scope.chartTitle = 'Facebook Likes';

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
    console.log(_(categories).pluck('cat'));
    console.log(_(categories).pluck('count'));
    $scope.catLabels = _(categories).pluck('cat');
    $scope.catData = [_(categories).pluck('count')];

  };


  //Get data for first
 /* var getData = parseFBlikeData(getFBfeed());
  console.log(getData);*/

  getFBlikes();


})


.controller('HomeCtrl', function($scope, UserService, $ionicActionSheet, $state, Account, $ionicLoading){

	//This gets user data from local storage depreceated as data is now retrived from remote server **MF**
  //$scope.user = UserService.getUser();
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
    Account.updateProfile($scope.user)
      .then(function() {
        alert('Profile has been updated');
      })
      .catch(function(response) {
        alert(response.data.message, response.status);
      });
  };

	$scope.showLogOutMenu = function() {
		var hideSheet = $ionicActionSheet.show({
			destructiveText: 'Logout',
			titleText: 'Are you sure you want to logout? ',
			cancelText: 'Cancel',
			cancel: function() {},
			buttonClicked: function(index) {
				return true;
			},
			destructiveButtonClicked: function(){
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
  console.log('changed to home');
  $scope.getProfile();
})

;
