'use strict';

var _ = require('lodash')
  ;

module.exports =
  function st2HistoryCtrl($scope, st2api, $rootScope, Notification) {

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


    st2api.client.executionsFilters.list().then(function (filters) {
      // TODO: when the field is not required, an abscense of a value should also be a value
      $scope.filters = filters;
      $scope.$apply();
    });

    var listFormat = function () {
      // Group all the records by periods of 24 hour
      var timeframe = 24 * 60 * 60 * 1000;

      $scope.history = $scope.historyList && _($scope.historyList)
        .filter({parent: undefined})
        .groupBy(function (record) {
          var time = record.start_timestamp;
          return new Date(Math.floor(+new Date(time) / timeframe) * timeframe).toISOString();
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
      pHistoryList = st2api.client.executions.list(_.assign({
        parent: 'null',
        exclude_attributes: 'result,trigger_instance',
        page: $rootScope.page,
        limit: 50
      }, $scope.$root.active_filters));

      $scope.busy = pHistoryList;

      pHistoryList.then(function (list) {
        // Hacking around angular-busy bug preventing $digest
        pHistoryList.then(function () {
          $scope.$apply();
        });

        $scope.historyList = list;

        listFormat();

        $scope.$emit('$fetchFinish', st2api.client.executions);

        $scope.$apply();
      }).catch(function (err) {
        $scope.groups = [];
        $scope.error = err;

        Notification.criticalError(err, 'Failed to fetch data');

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
        var first = _.first(records);
        if (first) {
          return st2api.client.executions.get(first.id);
        } else {
          throw null;
        }
      });

      promise.then(function (record) {
        if (record.end_timestamp) {
          record.execution_time = Math.ceil((new Date(record.end_timestamp).getTime() -
                                             new Date(record.start_timestamp).getTime()) / 1000);
        }
        $scope.record = record;

        // Spec and payload to build a form for the action input. Strict resemblence to form from
        // Action tab is not guaranteed.
        const properties = {};

        for (const [ k, v ] of _.toPairs(record.runner.runner_parameters)) {
          properties[k] = Object.assign({}, properties[k], v);
        }

        for (const [ k, v ] of _.toPairs(record.action.parameters)) {
          properties[k] = Object.assign({}, properties[k], v);
        }

        $scope.actionSpec = {
          type: 'object',
          properties
        };

        $scope.payload = _.clone(record.parameters);

        if (record.parent) {
          pHistoryList.then(function () {
            var parent = _.find($scope.historyList, {id: record.parent});
            $scope.expand(parent, null, true);
          });
        }

        $scope.$apply();
      }).catch(function (err) {
        if (!err) {
          return;
        }

        if (!id && err.status === 403) {
          return;
        }

        Notification.criticalError(err, 'Failed to fetch execution');
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

        if ($scope.record && $scope.record.id === record.id) {
          _.assign($scope.record, record);
        }

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
          parent: record.id,
          exclude_attributes: 'result,trigger_instance',
          limit: 0,
          offset: 0
        }).then(function (records) {
          if (!record._children) {
            record._children = records;
            $scope.historyList = $scope.historyList.concat(records);

            $scope.$apply();
          }
        });
      }
    };

    $scope.rerun = {
      open: function () {
        $scope.$root.go('^.rerun', {id: $scope.record.id});
      },

      cancel: function () {
        $scope.$root.go('^.general', {id: $scope.record.id});
      },

      submit: function (parameters) {
        st2api.client.executions.repeat($scope.record.id, { parameters }, {
          no_merge: true
        })
          .then((record) => {
            $scope.$root.go('^.general', {id: record.id});
          })
          .catch((err) => {
            $scope.rerunform.err = true;
            $scope.$apply();
            $scope.rerunform.err = false;
            Notification.criticalError(err, 'Failed to rerun execution');
          });
      }
    };

    $scope.cancel = function () {
      st2api.client.executions.delete($scope.record.id)
        .then(function () {
          Notification.primary('Requesting execution cancellation');
        })
        .catch(function (err) {
          Notification.criticalError(err, 'Failed to cancel execution');
        });
    };

  };
