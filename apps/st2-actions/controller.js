'use strict';
angular.module('main')
  .config(function ($stateProvider) {

    $stateProvider
      .state('actions', {
        abstract: true,
        url: '/actions',
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

      ;

  });

angular.module('main')

  .controller('st2ActionsCtrl', function ($scope, st2Api, $q) {

    $scope._api = st2Api;

    $scope.$watch('_api.actions.list() | unwrap', function (list) {
      $scope.groups = list && _.groupBy(list, 'content_pack');
    });

    st2Api.actions.fetchAll();

    $scope.$watch('$root.state.params.id', function (id) {
      // TODO: figure out why you can't use $filter('unwrap')(...) here
      st2Api.actions.get(id).then(function (action) {
        $scope.action = action;

        $scope.payload = {};

        $scope.reloadExecutions(action.id);

        if ($scope.actionHasFile(action)) {
          st2Api.actionEntryPoints.get(id).then(function (file) {
            $scope.file = file;
          });
        }

      });
    });

    $scope.reloadExecutions = function (action_id) {
      $scope.inProgress = true;

      st2Api.executions.find({
        'action_id': action_id,
        'limit': 5
      }).then(function (executions) {
        $scope.inProgress = false;
        $scope.executions = executions;
      });
    };

    // Running an action
    $scope.runAction = function (actionName, payload) {
      var retry = function (fn, condition) {
        var defer = $q.defer()
          , TIMEOUT = 1000;

        _.delay(function () {
          fn()
            .catch(defer.reject)
            .then(function (result) {
              if (condition(result)) {
                defer.resolve(result);
              } else {
                retry(fn, condition).then(function (result) {
                  // this function would be launched once for every retry which may be an
                  // unpleasant overhead on some long running tasks. TODO: refactor eventually.
                  defer.resolve(result);
                });
              }
            });
        }, TIMEOUT);

        return defer.promise;
      };

      st2Api.executions.create({
        action: {
          name: actionName
        },
        parameters: payload
      }).then(function (execution) {
        var index = $scope.executions.length;

        $scope.executions[index] = execution;

        var updateExecution = function () {
          return st2Api.executions.get(execution.id)
            .then(function (result) {
              $scope.executions[index] = result;
              return result;
            });
        };

        $scope.inProgress = true;

        retry(updateExecution, function (execution) {
          var finalStates = ['succeeded', 'failed'];
          return _.contains(finalStates, execution.status);
        }).finally(function () {
          $scope.inProgress = false;
        });
      });
    };

    //helpers
    $scope.actionHasFile = function (action) {
      var runnersWithFiles = ['workflow', 'run-local-script', 'action-chain'];

      return action && _.contains(runnersWithFiles, action.runner_type);
    };

  })

  ;
