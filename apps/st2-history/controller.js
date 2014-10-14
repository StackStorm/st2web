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
        url: '?page&action_id'
      })
      .state('history.summary', {
        url: '/{id:\\w+}?page&action_id'
      })
      .state('history.details', {
        url: '/{id:\\w+}/details?page&action_id'
      })

      ;

  });

angular.module('main')

  // List history records
  .controller('st2HistoryCtrl', function ($scope, st2Api) {

    $scope._api = st2Api;

    $scope.$watch('_api.history.list() | unwrap', function (list) {
      // Group all the records by periods of 24 hour
      var period = 24 * 60 * 60 * 1000;

      $scope.history = _(list).groupBy(function (record) {
        // ISO, please!
        var time = record.execution.start_timestamp.split(' ').join('T');
        return new Date(Math.floor(+new Date(time) / period) * period).toISOString();
      }).map(function (records, period) {
        return {
          period: period,
          records: records
        };
      }).value();
    });

    $scope.$watch('$root.state.params.page', function (page) {
      st2Api.history.fetch(page, {
        parent: 'null',
        action_id: $scope.$root.state.params.action_id
      });
    });

    $scope.$watch('$root.state.params.id', function (id) {
      // TODO: figure out why you can't use $filter('unwrap')(...) here
      st2Api.history.get(id).then(function (record) {
        $scope.record = record;

        // Spec and payload to build a form for the action input. Strict resemblence to form from
        // Action tab is not guaranteed.
        $scope.spec = _({}).defaults(record.action.parameters, record.runner.runner_parameters)
          .mapValues(function (e) {
            e.disabled = true;
            return e;
          }).value();

        $scope.payload = _.clone(record.execution.parameters);
      });
    });

    $scope.expand = function (record) {
      record._expanded = true;

      return st2Api.history.find({
        'parent': record.id
      }).then(function (records) {
        record._children = records;
      });
    };

    $scope.contract = function (record) {
      record._expanded = false;
      return true;
    };

    // helpers
    $scope.isExpandable = function (record) {
      var runnerWithChilds = ['workflow', 'action-chain'];
      return runnerWithChilds.indexOf(record.action.runner_type) !== -1;
    };
  })

  ;
