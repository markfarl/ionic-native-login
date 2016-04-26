angular.module('controllers', [])
.controller('LoginCtrl', function($ionicPopup, $scope, $http, $state, $q, UserService, $ionicLoading, serverUrl, $ionicScrollDelegate) {

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
        $state.go('app.home.mydetails');
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


