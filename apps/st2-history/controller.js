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
      .state('history.general', {
        url: '/{id:\\w+}/general?page&action&rule&trigger&trigger_type'
      })

      ;

  });

angular.module('main')

  // List history records
  .controller('st2HistoryCtrl', function ($scope, st2api, $rootScope, st2LoaderService) {

    var pHistoryList;

    st2LoaderService.reset();

    st2api.historyFilters.list().then(function (filters) {
      // TODO: when the field is not required, an abscense of a value should also be a value
      $scope.filters = filters;
      $scope.$apply();
    });

    var listUpdate = function () {
      st2LoaderService.start();

      pHistoryList = st2api.history.list(_.assign({
        parent: 'null',
        page: $rootScope.page
      }, $scope.$root.filters));

      pHistoryList.then(function (list) {
        // Group all the records by periods of 24 hour
        var period = 24 * 60 * 60 * 1000;

        $scope.history = list && _(list)
          .groupBy(function (record) {
            var time = record.execution.start_timestamp;
            return new Date(Math.floor(+new Date(time) / period) * period).toISOString();
          })
          .map(function (records, period) {
            return {
              period: period,
              records: records
            };
          })
          .value();

        $scope.$emit('$fetchFinish', st2api.history);
        st2LoaderService.stop();

        $scope.$apply();
      }).catch(function (err) {
        $scope.groups = [];
        console.error('Failed to fetch the data: ', err);
      });
    };

    $scope.$watch('[$root.filters, $root.page]', listUpdate, true);

    $scope.$watch('$root.state.params.id', function (id) {
      if (!pHistoryList) {
        throw {
          name: 'RaceCondition',
          message: 'Possible race condition. History promise does not exist yet.'
        };
      }

      var promise = id ? st2api.history.get(id) : pHistoryList.then(function (actions) {
        return _.first(actions);
      });

      promise.then(function (record) {
        $scope.record = record;

        // Spec and payload to build a form for the action input. Strict resemblence to form from
        // Action tab is not guaranteed.
        $scope.spec = _({}).defaults(record.action.parameters, record.runner.runner_parameters)
          .mapValues(function (e) {
            e.disabled = true;
            return e;
          }).value();

        $scope.payload = _.clone(record.execution.parameters);

        $scope.$apply();
      });
    });

    $scope.expand = function (record, $event) {
      $event.stopPropagation();

      record._expanded = !record._expanded;

      if (record._expanded) {
        st2api.history.list({
          'parent': record.id
        }).then(function (records) {
          record._children = records;
          this.$apply();
        }.bind(this));
      }
    };

    // helpers
    $scope.isExpandable = function (record) {
      var runnerWithChilds = ['workflow', 'action-chain', 'mistral-v1', 'mistral-v2'];
      return _.contains(runnerWithChilds, record.action.runner_type);
    };
  })

  ;
