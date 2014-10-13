'use strict';
angular.module('main')
  .config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/rules');

    $stateProvider
      .state('rules', {
        abstract: true,
        url: '/rules',
        controller: 'st2RulesCtrl',
        templateUrl: 'apps/st2-rules/template.html',
        title: 'Rules'
      })
      .state('rules.list', {
        url: '?page'
      })
      .state('rules.summary', {
        url: '/{id:\\w+}?page'
      })
      .state('rules.details', {
        url: '/{id:\\w+}/details?page'
      })

      ;

  });

angular.module('main')

  // List rules
  .controller('st2RulesCtrl', function ($scope, st2Api) {

    $scope._api = st2Api;

    $scope.$watch('_api.rules.list() | unwrap', function (list) {
      $scope.rules = list;
    });

    $scope.$watch('$root.state.params.page', function (page) {
      st2Api.rules.fetch(page);
    });

    $scope.$watch('$root.state.params.id', function (id) {
      // TODO: figure out why you can't use $filter('unwrap')(...) here
      st2Api.rules.get(id).then(function (rule) {
        $scope.rule = rule;
      });
    });
  })

  ;
