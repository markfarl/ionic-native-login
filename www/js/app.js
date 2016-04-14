// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'controllers', 'services',  'chart.js', 'ionic-material', 'ionMdInput'])

.constant('serverUrl', 'http://46.22.136.60:80')
.constant('pageViewed' , {
  stats: 0,
  messageAnal: 0,
  questions: 0
})

.run(function($ionicPlatform, $rootScope, stateService) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });

//Globbally puts the change state service as function use ng-click="appData.goState(path)"
  $rootScope.appData = stateService;


})


.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('welcome', {
    url: '/welcome',
    abstract: true,
    templateUrl: "views/start.html",
    controller: 'WelcomeCtrl'

  })

    .state('welcome.terms', {
      url: "/terms",
      cache : false,
      views: {
        'welcomeContent': {
          templateUrl: "views/terms.html",

        }
      }
    })
    .state('welcome.consent', {
      url: "/consent",
      cache : false,
      views: {
        'welcomeContent': {
          templateUrl: "views/consent.html",
          controller: 'WelcomeCtrl'
        }
      }
    })

    .state('welcome.login', {
      url: "/login",
      views: {
        'welcomeContent': {
          templateUrl: "views/login.html",
          controller: 'WelcomeCtrl'
        }
      }
    })

  .state('app', {
    url: "/app",
    cache : false,
    abstract: true,
    templateUrl: "views/sidemenu.html",
    controller: 'AppCtrl'
  })

  .state('app.home', {
    url: "/home",
    cache : false,
    views: {
      'menuContent': {
        templateUrl: "views/home.html",
        controller: 'HomeCtrl'
      }
    }
  })
    .state('app.home.analytics', {
      url: "/analytics",
      cache : false,
      views: {
        'dashboardContent': {
          templateUrl: "views/analytics.html"
        }
      }
    })

    .state('app.home.mydetails', {
      url: "/mydetails",
      cache : false,
      views: {
        'dashboardContent': {
          templateUrl: "views/mydetails.html"
        }
      }
    })

    .state('app.stats', {
      url: "/stats",
      cache : false,
      views: {
        'menuContent': {
          templateUrl: "views/stats.html",
          controller: 'StatsCtrl'
        }
      }
    })
    .state('app.msganalysis', {
      url: "/msganalysis",
      cache : false,
      views: {
        'menuContent': {
          templateUrl: "views/messageAnalysis.html",
          controller: 'AnalysisCtrl'
        }
      }
    })
    .state('app.questions', {
      url: "/questions",
      cache : false,
      views: {
        'menuContent': {
          templateUrl: "views/questions.html",
          controller: 'QuestionsCtrl'
        }
      }
    })
    .state('app.results', {
      url: "/results",
      views: {
        'menuContent': {
          templateUrl: "views/results.html",
          controller: 'ResultsCtrl'
        }
      }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/welcome/consent');
})

;
