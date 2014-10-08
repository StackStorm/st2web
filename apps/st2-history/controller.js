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
        url: '?page'
      })
      .state('history.summary', {
        url: '/{id:\\w+}?page'
      })
      .state('history.details', {
        url: '/{id:\\w+}/details?page'
      })

      ;

  });

angular.module('main')

  // List history records
  .controller('st2HistoryCtrl', function ($scope, st2Api, $rootScope) {

    st2Api.history.$watch('list() | unwrap', function (list) {
      // Group all the records by periods of 24 hour
      var period = 24 * 60 * 60 * 1000;
      $scope.history = _.groupBy(list, function (record) {
        var time = record.action_execution.start_timestamp;
        return new Date(Math.floor(+new Date(time) / period) * period).toISOString();
      });
    });

    $rootScope.$watch('state.params.page', function (page) {
      st2Api.history.fetch(page, {
        parent: 'null'
      });
    });

    $rootScope.$watch('state.params.id', function (id) {
      // TODO: figure out why you can't use $filter('unwrap')(...) here
      st2Api.history.get(id).then(function (record) {
        $scope.record = record;

        st2Api.history.find({
          'parent': record.parent || record.id
        }).then(function (records) {
          $scope.children = records;
        });
      });
    });

    // helpers
    $scope.isExpandable = function (record) {
      var runnerWithChilds = ['workflow', 'action-chain'];
      return runnerWithChilds.indexOf(record.action.runner_type) !== -1;
    };

    $scope.isCurrent = function (record) {
      if (record) {
        var current = $scope.record;
        return current && (record.id === current.id || record.id === current.parent);
      }
    };
  })

  ;
