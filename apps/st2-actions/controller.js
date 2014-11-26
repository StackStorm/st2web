'use strict';
angular.module('main')
  .config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/actions');

    $stateProvider
      .state('actions', {
        abstract: true,
        url: '/actions',
        icon: 'st2-icon__actions',
        controller: 'st2ActionsCtrl',
        templateUrl: 'apps/st2-actions/template.html',
        title: 'Actions'
      })
      .state('actions.list', {
        url: ''
      })
      .state('actions.summary', {
        url: '/{id:\\w+}'
      })
      .state('actions.details', {
        url: '/{id:\\w+}/details'
      })
      .state('actions.code', {
        url: '/{id:\\w+}/code'
      })

      ;

  });

angular.module('main')

  .controller('st2ActionsCtrl', function ($scope, st2api) {

    $scope.filter = '';

    var pActionList = st2api.actionOverview.list().catch(function (response) {
      $scope.groups = [];
      console.error('Failed to fetch the data: ', response);
    });

    var listUpdate = function () {
      pActionList && pActionList.then(function (list) {
        $scope.groups = list && _(list)
          .filter(function (action) {
            return $scope.$root.getRef(action).indexOf($scope.filter) > -1;
          })
          .groupBy('pack')
          .value();

        $scope.$apply();
      });
    };

    $scope.$watch('filter', listUpdate);

    $scope.$watch('$root.state.params.id', function (id) {
      var promise = id ? st2api.actionOverview.get(id) : pActionList.then(function (actions) {
        return _.first(actions);
      });

      promise.then(function (action) {
        $scope.action = action;

        $scope.payload = {};

        $scope.reloadExecutions(action);

        if ($scope.actionHasFile(action)) {
          st2api.actionEntryPoint.get(action.id).then(function (file) {
            $scope.file = file;
            $scope.$apply();
          }).catch(function (err) {
            console.error(err);
          });
        }

        $scope.$apply();
      });
    });

    $scope.reloadExecutions = function (action) {
      $scope.inProgress = true;

      return st2api.history.list({
        'action': $scope.$root.getRef(action),
        'limit': 5,
        'parent': 'null'
      }).then(function (history) {
        $scope.inProgress = false;

        $scope.history = history;

        $scope.$apply();
      });

    };

    // Running an action
    $scope.runAction = function (action, payload) {
      st2api.actionExecutions.create({
        action: $scope.$root.getRef(action),
        parameters: payload
      }).then(function (execution) {
        // Get a history record for an execution. Another request we could avoid if we design api
        // thoughtfully.
        return st2api.history.list({
          execution: execution.id
        }).then(function (records) {
          // This approach is prone to race condition due to the gap between the time
          // ActionExecution and History gets created (see STORM-840)
          if (!records.length) {
            throw {
              name: 'UnknownError',
              message: 'There is no history records associated with the particular execution: ' +
                execution.id
            };
          }
          return records[0];
        });

      }).then(function (record) {
        // Put it in the list
        var index = $scope.history.push(record) - 1;

        $scope.inProgress = true;
        $scope.$apply();

        // Then update it until it dets resolved
        st2api.history.watch(record.id, function (record) {
          $scope.history[index] = record;
          $scope.$apply();

          return record.execution.status === 'failed' || record.execution.status === 'succeeded';
        }).then(function () {
          $scope.inProgress = false;
          $scope.$apply();
        });
      }).catch(function (err) {
        console.error(err);
      });
    };

    //helpers
    $scope.actionHasFile = function (action) {
      var runnersWithFiles = [
        'mistral-v1',
        'mistral-v2',
        'workflow',
        'run-local-script',
        'run-remote-script',
        'run-python',
        'action-chain'
      ];

      return action && _.contains(runnersWithFiles, action.runner_type);
    };

    $scope.isWorkflow = function (action) {
      var workflow = ['workflow', 'action-chain', 'mistral-v1', 'mistral-v2'];
      return _.contains(workflow, action.runner_type);
    };

  })

  ;
