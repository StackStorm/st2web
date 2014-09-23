'use strict';
angular.module('main')
  .config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/rules');

    $stateProvider

      .state('rules', {
        url: '/rules',
        templateUrl: 'apps/st2-rules/template.html',
        controller: 'st2RulesCtrl',
        title: 'Rules'
      })

      ;
  });

angular.module('main')

  // List actions
  .controller('st2RulesCtrl', function ($scope, st2Api) {
    $scope.rules = st2Api.rules.list();
  })

  ;
