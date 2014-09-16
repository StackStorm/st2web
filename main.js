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

      .state('act', {
        url: '/act',
        controller: 'st2ActCtrl',
        templateUrl: 'apps/st2-act/template.html',
        title: 'Act'
      })

      .state('rules', {
        url: '/rules',
        templateUrl: 'apps/st2-rules/template.html',
        controller: 'st2RulesCtrl',
        title: 'Rules'
      })
      .state('ruleConstructor', {
        url: '/rules/create',
        templateUrl: 'apps/st2-rules/edit.html',
        controller: 'st2RuleCreateCtrl'
      })
      .state('ruleEdit', {
        url: '/rules/:id',
        templateUrl: 'apps/st2-rules/edit.html',
        controller: 'st2RuleEditCtrl'
      })

      .state('audit', {
        url: '/audit',
        controller: 'st2AuditCtrl',
        templateUrl: 'apps/st2-audit/template.html',
        title: 'Audit'
      });
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
