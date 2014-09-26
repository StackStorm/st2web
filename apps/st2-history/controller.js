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
        url: '/:id'
      })
      .state('history.details', {
        url: '/:id/details'
      })

      ;

  });

angular.module('main')

  // List history records
  .controller('st2HistoryCtrl', function ($scope, st2Api) {
    $scope.history = st2Api.history.list();

    $scope.$watch('state.params.id', function (id) {
      $scope.current = id ? st2Api.history.get({ id: id }) : null;
    });
  })

  ;
