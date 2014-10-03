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
    var historyList = st2Api.history.list();

    $scope.history = historyList.$promise.then(function (records) {
      // Group all the records by periods of 24 hour
      var period = 24 * 60 * 60 * 1000;
      return _.groupBy(records, function (record) {
        var time = record.action_execution.start_timestamp;
        return new Date(Math.floor(+new Date(time) / period) * period).toISOString();
      });
    });

    $scope.actions = st2Api.actions.list();
    $scope.rules = st2Api.rules.list();
    $scope.triggers = st2Api.triggers.list();

    $scope.current = {};

    function fetchOne(id) {
      $scope.current.record = st2Api.history.get({ id: id });

      $scope.current.record
        .$promise.then(function (record) {
          if ($scope.isExpandable && !record.parent) {
            $scope.current.children = st2Api.history.list({ parent: record.id });
          }
        });

    }

    $scope.$watch('state.params.id', function (id) {
      if (id) {
        fetchOne(id);
      } else {
        historyList.$promise.then(function (history) {
          var id = history && history[0] && history[0].id;
          fetchOne(id);
        });
      }
    });


    // helpers
    $scope.isExpandable = function (record) {
      if (record.parent) {
        return true;
      }

      var runnerWithChilds = ['workflow', 'action-chain'];
      return runnerWithChilds.indexOf(record.action.runner_type) !== -1;
    };

    $scope.isCurrent = function (record) {
      if (record.parent) {
        return true;
      }

      return record && record.id === $scope.current.record.id;
    };
  })

  ;
