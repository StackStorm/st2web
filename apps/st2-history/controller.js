'use strict';
angular.module('main')
  .config(function ($stateProvider) {

    $stateProvider
      .state('history', {
        abstract: true,
        url: '/history',
        controller: 'st2HistoryCtrl',
        templateUrl: 'apps/st2-history/template.html',
        title: 'History'
      })
      .state('history.list', {
        url: ''
      })
      .state('history.summary', {
        url: '/{id:\\w+}'
      })
      .state('history.details', {
        url: '/{id:\\w+}/details'
      })

      ;

  });

angular.module('main')

  // List history records
  .controller('st2HistoryCtrl', function ($scope, st2Api) {
    $scope.history = st2Api.history.list();

    $scope.actions = st2Api.actions.list();
    $scope.rules = st2Api.rules.list();
    $scope.triggers = st2Api.triggers.list();

    function fetchOne(id) {
      $scope.current = st2Api.history.get({ id: id });
    }

    $scope.$watch('state.params.id', function (id) {
      if (id) {
        fetchOne(id);
      } else {
        $scope.history.$promise.then(function (history) {
          var id = history && history[0] && history[0].id;
          fetchOne(id);
        });
      }
    });
  })

  ;
