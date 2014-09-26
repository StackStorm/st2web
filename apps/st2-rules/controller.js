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
        url: '/{id:\\w+}'
      })
      .state('rules.details', {
        url: '/{id:\\w+}/details'
      })

      ;

  });

angular.module('main')

  // List rules
  .controller('st2RulesCtrl', function ($scope, st2Api) {
    $scope.rules = st2Api.rules.list();

    function fetchOne(id) {
      $scope.current = st2Api.rules.get({ id: id });
    }

    $scope.$watch('state.params.id', function (id) {
      if (id) {
        fetchOne(id);
      } else {
        $scope.rules.$promise.then(function (rules) {
          var id = rules && rules[0] && rules[0].id;
          fetchOne(id);
        });
      }
    });
  })

  ;
