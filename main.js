'use strict';

angular.module('main', ['ui.router', 'ngResource', 'angularMoment'])
  .config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/rules');

    $stateProvider
      // Controller for testing. Won't show up in main menu.
      .state('docs', {
        url: '/docs',
        controller: 'st2DocsCtrl',
        templateUrl: 'apps/st2-docs/template.html'
      })

      .state('actions', {
        abstract: true,
        url: '/actions',
        controller: 'st2ActionListCtrl',
        templateUrl: 'apps/st2-actions/template.html',
        title: 'Actions'
      })
      .state('actions.list', {
        url: '',
        template: 'none'
      })
      .state('actions.summary', {
        url: '/:id',
        views: {
          summary: {
            controller: 'st2ActionGetCtrl',
            templateUrl: 'apps/st2-actions/summary.html'
          }
        }
      })
      .state('actions.details', {
        url: '/:id/details',
        views: {
          summary: {
            controller: 'st2ActionGetCtrl',
            templateUrl: 'apps/st2-actions/summary.html'
          },
          details: {
            controller: 'st2ActionGetCtrl',
            templateUrl: 'apps/st2-actions/details.html'
          }
        }
      })

      .state('rules', {
        url: '/rules',
        templateUrl: 'apps/st2-rules/template.html',
        controller: 'st2RulesCtrl',
        title: 'Rules'
      })

      .state('history', {
        url: '/history',
        controller: 'st2HistoryCtrl',
        templateUrl: 'apps/st2-history/template.html',
        title: 'History'
      })

      ;
  });

angular.module('main')
  .controller('MainCtrl', function ($scope, $state) {
    $scope.state = $state;
    $scope._ = _;

    // Don't forget to add a target for every href in menu
    // $scope.$on('$stateChangeStart', function (event, toState) {
    //   window.name = toState.name;
    // });
  });

angular.module('main')
  .filter('has', function () {
    return function (input, name) {
      return _.filter(input, function (e) {
        return !!e[name];
      });
    };
  });
