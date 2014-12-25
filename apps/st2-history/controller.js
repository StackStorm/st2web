'use strict';
angular.module('main')
  .config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/history');

    $stateProvider
      .state('history', {
        abstract: true,
        url: '/history',
        icon: 'st2-icon__history',
        controller: 'st2HistoryCtrl',
        templateUrl: 'apps/st2-history/template.html',
        title: 'History',
        position: 1
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

    $scope.error = null;

    var savedView = JSON.parse(sessionStorage.getItem('st2HistoryView'));

    $scope.view = savedView || {
      'time': {
        title: 'Time',
        value: true,
        subview: {
          'end': {
            title: 'End time',
            value: false
          }
        }
      },
      'action': {
        title: 'Action name',
        value: true,
        subview: {
          'params': {
            title: 'Parameters',
            value: false
          }
        }
      },
      'trigger': {
        title: 'Triggered by',
        value: true
      },
      'status': {
        title: 'Status',
        value: true
      }
    };

    $scope.$watch('view', function (view) {
      sessionStorage.setItem('st2HistoryView', JSON.stringify(view));
    }, true);

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
      }, $scope.$root.active_filters));

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
        $scope.error = err.message;

        console.error('Failed to fetch the data: ', err);
        st2LoaderService.stop();

        $scope.$apply();
      });
    };

    $scope.$watch('[$root.active_filters, $root.page]', listUpdate, true);

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

    st2api.stream.listen().then(function (source) {

      source.addEventListener('st2.history__update', function (e) {
        var record = JSON.parse(e.data);
        _.first($scope.history, function (period) {
          var index = _.findIndex(period.records, { 'id': record.id });
          if (index !== -1) {
            period.records[index] = record;
            $scope.$apply();
            return true;
          }
          return false;
        });
      });

    });

    $scope.fmtParam = function (value) {
      if (_.isString(value)) {
        return '"' + (value.length < 20 ? value : value.substr(0, 20) + '...') + '"';
      }

      if (_.isArray(value)) {
        return '[' +
        _(value).first(3).map($scope.fmtParam).join(', ') +
        (value.length > 3 ? ',..' : '') +
        ']';
      }

      return value;
    };

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
