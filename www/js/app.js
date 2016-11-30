// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var standardAns = {
  'Daily': 4, //<48 Hrs
  'Weekly': 3, //<336 Hrs
  'Monthly': 2,//< 1440 Hrs
  'Less than monthly': 1,//< 8760 Hrs
  'Never': 0// 8760 Hrs +
};

angular.module('starter', ['ionic', 'controllers', 'services',  'chart.js', 'ionic-material', 'ionMdInput'])

.constant('serverUrl', 'http://bigfoot.adaptcentre.ie:81')
.constant('testerIDarry',[
  10156550201005291,
  10153443843601616
])

  .constant('pageViewed' , {
  stats: 0,
  messageAnal: 0,
  questions: 0
})
  .constant('resultsType', {
  result_table:[
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
      text: "Please do not crush me with your huge feet! You prefer to use social media at least once a day and you wish to be actively engaged with it. You would prefer to think about what personal information occasionaly might not be smart to put up on the web, but not often.",
      image: "newD.png"
    },
    {
      label: "King-kong (E)",
      text: "Will you look at the size of that thing? You almost crushed that guy’s house! You use social media quite a few times every day and are actively engaged with it. You don’t really seem care about what happens with your data.",
      image: "newE.png"
    }
  ]
})
  .constant('QuestionObjects',
{
  questionSetOne: [
    {
      title: 'How often do you post on Facebook',
      model: 'question1',
      items: standardAns
    },
    {
      title: 'How often do you tag your own images of yourself?',
      model: 'question2',
      items: standardAns
    },
    {
      title: 'How often are your posts links?',
      model: 'question3',
      items: standardAns
    },
    {
      title: 'How often are your posts text only?',
      model: 'question4',
      items: standardAns
    },
    {
      title: 'How often do you share friends posts?',
      model: 'question5',
      items: standardAns
    }
  ],
    questionSetTwo: [
  {
    title: 'How often do you get tagged in friends posts?',
    model: 'question6',
    items: standardAns
  },
  {
    title: 'How often do you tag yourself in your own posts?',
    model: 'question7',
    items: standardAns
  },
  {
    title: 'How often do you tag your friends in your own posts?',
    model: 'question8',
    items: standardAns
  },
  {
    title: 'How often do you engage with the event function in Facebook?',
    model: 'question9',
    items: standardAns
  },
  {
    title: 'How often do you like public pages?',
    model: 'question10',
    items: standardAns
  }
],
  questionSetThree: {
    question: "What type of public pages do you like?",
    data: [
    {
      title: 'Entertainment posts',
      model: 'sharedCheck_Funny'
    },
    {
      title: 'Sports posts',
      model: 'sharedCheck_Sports'
    },
    {
      title: 'Political posts',
      model: 'sharedCheck_Political'
    },
    {
      title: 'Music posts',
      model: 'sharedCheck_music'
    },
    {
      title: 'Other',
      model: 'sharedCheck_Other'
    },
      {
        title: 'None',
        model: 'sharedCheck_None'
      }
  ]
  },
  questionSetFour: {
    question: "I use the following social media apps at least once a week?",
    data: [
      {
        title: 'Twitter',
        model: 'isChecked_twitter'
      },
      {
        title: 'Pinterest',
        model: 'isChecked_Pinterest'
      },
      {
        title: 'Linkedin',
        model: 'isChecked_Linkedin'
      },
      {
        title: 'Google',
        model: 'isChecked_Google'
      },
      {
        title: 'Instagram',
        model: 'isChecked_Instagram'
      },
      {
        title: 'Other',
        model: 'isChecked_Other'
      }
    ]
  },
  questionSetFive:{
    question: "I agree being contacted by a researcher to answer more questions and help this super cool research: ",
    model: "contactQuestion",
    answer:
      {
        Yes:"1",
        No:"3"
      }
  }
}
  )

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
    .state('slides', {
      url: '/slides',
      templateUrl: "views/slides.html",
      controller: 'SlidesCtrl'
    })
    .state('results-monkey', {
      url: "/results-monkey",
      templateUrl: "views/results-monkey.html",
      controller: 'ResultsMonkeyCtrl'
    })
    .state('welcome.terms', {
      url: "/terms",
      cache : false,
      views: {
        'welcomeContent': {
          templateUrl: "views/terms.html"

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
    abstract: true,
    templateUrl: "views/sidemenu.html",
    controller: 'AppCtrl'
  })

  .state('app.home', {
    url: "/home",
    views: {
      'menuContent': {
        templateUrl: "views/home.html",
        controller: 'HomeCtrl'
      }
    }
  })

    .state('app.stats', {
      url: "/stats",
      views: {
        'menuContent': {
          templateUrl: "views/stats.html",
          controller: 'StatsCtrl'
        }
      }
    })
    .state('app.friends-stats', {
      url: "/friends-stats",
      views: {
        'menuContent': {
          templateUrl: "views/friends-stats.html",
          controller: 'FriendStatsCtrl'
        }
      }
    })
    .state('app.third-party-stats', {
      url: "/fthird-party-stats",
      views: {
        'menuContent': {
          templateUrl: "views/third-party-stats.html",
          controller: 'thrdPartyStatsCtrl'
        }
      }
    })
    .state('app.page-likes-stats', {
      url: "/page-likes-stats",
      views: {
        'menuContent': {
          templateUrl: "views/page-likes-stats.html",
          controller: 'pageLikesStatsCtrl'
        }
      }
    })
    .state('app.footprint', {
      url: "/footprint",
      views: {
        'menuContent': {
          templateUrl: "views/footprint_main.html",
          controller: 'FootprintCtrl'
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

    .state('app.explicit-results', {
      url: "/results-explicit",
      views: {
        'menuContent': {
          templateUrl: "views/explicit-results.html",
          controller: 'ResultsMonkeyExplicitCtrl'
        }
      }
    })
    .state('app.dashboard', {
      url: "/dashboard",
      views: {
        'menuContent': {
          templateUrl: "views/dashboard.html",
          controller: 'DashboardCtrl'
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
});
