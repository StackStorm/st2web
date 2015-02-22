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
        url: '?page&status&action&rule&trigger&trigger_type'
      })
      .state('history.general', {
        url: '/{id:\\w+}/general?page&status&action&rule&trigger&trigger_type'
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
      'meta': {
        title: 'Meta',
        value: true,
        subview: {
          'status': {
            title: 'Status',
            value: true
          },
          'type': {
            title: 'Type',
            value: true
          },
          'time': {
            title: 'Time',
            value: true
          }
        }
      },
      'task': {
        title: 'Task',
        value: true
      },
      'action': {
        title: 'Action',
        value: true,
        subview: {
          'params': {
            title: 'Parameters',
            value: true
          }
        }
      },
      'trigger': {
        title: 'Triggered by',
        value: true
      }
    };

    $scope.$watch('view', function (view) {
      sessionStorage.setItem('st2HistoryView', JSON.stringify(view));
    }, true);

    st2LoaderService.reset();

    st2api.client.executionsFilters.list().then(function (filters) {
      // TODO: when the field is not required, an abscense of a value should also be a value
      $scope.filters = filters;
      $scope.$apply();
    });

    var listFormat = function () {
      // Group all the records by periods of 24 hour
      var period = 24 * 60 * 60 * 1000;

      $scope.history = $scope.historyList && _($scope.historyList)
        .filter({parent: undefined})
        .take(10)
        .groupBy(function (record) {
          var time = record.start_timestamp;
          return new Date(Math.floor(+new Date(time) / period) * period).toISOString();
        })
        .map(function (records, period) {
          return {
            period: period,
            records: records
          };
        })
        .value();
    };

    var listUpdate = function () {
      st2LoaderService.start();

      pHistoryList = st2api.client.executions.list(_.assign({
        parent: 'null',
        page: $rootScope.page
      }, $scope.$root.active_filters));

      pHistoryList.then(function (list) {
        $scope.historyList = list;

        listFormat();

        $scope.$emit('$fetchFinish', st2api.client.executions);
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

      var promise = id ? st2api.client.executions.get(id) : pHistoryList.then(function (records) {
        return _.first(records);
      });

      promise.then(function (record) {
        $scope.record = record;

        // Spec and payload to build a form for the action input. Strict resemblence to form from
        // Action tab is not guaranteed.
        $scope.spec = _({}).defaults(record.action.parameters, record.runner.runner_parameters)
          .value();

        $scope.payload = _.clone(record.parameters);

        if (record.parent) {
          pHistoryList.then(function () {
            var parent = _.find($scope.historyList, {id: record.parent});
            $scope.expand(parent, null, true);
          });
        }

        $scope.$apply();
      });
    });

    st2api.client.stream.listen().then(function (source) {
      var createListener = function (e) {

        var record = JSON.parse(e.data);

        if (record.parent) {
          var parentNode = _.find($scope.historyList, { id: record.parent });

          if (parentNode && parentNode._children) {
            parentNode._children.push(record);
            $scope.historyList.unshift(record);
          }
        } else {
          // TODO: Implement client-side filtering.
          if (_($scope.$root.active_filters).values().some()) {
            return;
          }
          // New records should not only appear if we are on the specific page.
          if ($rootScope.page && $rootScope.page !== 1) {
            return;
          }

          $scope.historyList && $scope.historyList.unshift(record);
          listFormat();
        }

        $scope.$apply();
      };

      source.addEventListener('st2.execution__create', createListener);

      var updateListener = function (e) {
        var record = JSON.parse(e.data);

        var node = _.find($scope.historyList, {id: record.id});

        _.assign(node, record);

        $scope.$apply();
      };

      source.addEventListener('st2.execution__update', updateListener);

      $scope.$on('$destroy', function () {
        source.removeEventListener('st2.execution__create', createListener);
        source.removeEventListener('st2.execution__update', updateListener);
      });

    });

    $scope.expand = function (record, $event, value) {
      $event && $event.stopPropagation();

      record._expanded = _.isUndefined(value) ? !record._expanded : value;

      if (record._expanded) {
        st2api.client.executions.list({
          'parent': record.id
        }).then(function (records) {
          if (!record._children) {
            record._children = records;
            $scope.historyList = $scope.historyList.concat(records);

            $scope.$apply();
          }
        });
      }
    };

  })

  .filter('fmtParam', function () {
    var fmtParam = function (value) {
      if (_.isString(value)) {
        return '"' + (value.length < 20 ? value : value.substr(0, 20) + '...') + '"';
      }

      if (_.isArray(value)) {
        return '[' +
        _(value).first(3).map(fmtParam).join(', ') +
        (value.length > 3 ? ',..' : '') +
        ']';
      }

      return value;
    };

    return fmtParam;
  })

  .filter('isExpandable', function () {
    return function (record) {
      var runnerWithChilds = ['workflow', 'action-chain', 'mistral-v1', 'mistral-v2'];
      return _.contains(runnerWithChilds, record.action.runner_type);
    };
  })

  ;
