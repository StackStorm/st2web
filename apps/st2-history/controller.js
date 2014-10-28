'use strict';
angular.module('main')
  .config(function ($stateProvider) {

    $stateProvider
      .state('history', {
        abstract: true,
        url: '/history',
        icon: 'st2-icon__history',
        controller: 'st2HistoryCtrl',
        templateUrl: 'apps/st2-history/template.html',
        title: 'History'
      })
      .state('history.list', {
        url: '?page&action&rule&trigger&trigger_type'
      })
      .state('history.summary', {
        url: '/{id:\\w+}?page&action&rule&trigger&trigger_type'
      })
      .state('history.details', {
        url: '/{id:\\w+}/details?page&action&rule&trigger&trigger_type'
      })

      ;

  });

angular.module('main')

  // List history records
  .controller('st2HistoryCtrl', function ($scope, st2Api) {

    $scope._api = st2Api;

    st2Api.historyFilters.fetchAll();

    $scope.$watch('_api.history.list() | unwrap', function (list) {
      // Group all the records by periods of 24 hour
      var period = 24 * 60 * 60 * 1000;

      $scope.history = list && _(list).groupBy(function (record) {
        var time = record.execution.start_timestamp;
        return new Date(Math.floor(+new Date(time) / period) * period).toISOString();
      }).map(function (records, period) {
        return {
          period: period,
          records: records
        };
      }).value();
    });

    $scope.$watchCollection('[$root.filters, $root.page]', function () {
      st2Api.history.fetch($scope.$root.page, _.defaults({
        parent: 'null'
      }, $scope.$root.filters));
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

    $scope.toggle = function (record, $event) {
      $event.stopPropagation();

      record._expanded = !record._expanded;

      if (record._expanded) {
        st2Api.history.find({
          'parent': record.id
        }).then(function (records) {
          record._children = records;
        });
      }
    };

    // helpers
    $scope.isExpandable = function (record) {
      var runnerWithChilds = ['workflow', 'action-chain', 'mistral-v1', 'mistral-v2'];
      return _.contains(runnerWithChilds, record.action.runner_type);
    };
  })

  ;
