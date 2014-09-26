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
        url: ''
      })
      .state('rules.summary', {
        url: '/:id'
      })
      .state('rules.details', {
        url: '/:id/details'
      })

      ;

  });

angular.module('main')

  // List rules
  .controller('st2RulesCtrl', function ($scope, st2Api) {
    $scope.rules = st2Api.rules.list();

    $scope.$watch('state.params.id', function (id) {
      $scope.current = id ? st2Api.rules.get({ id: id }) : null;
    });
  })

  ;
