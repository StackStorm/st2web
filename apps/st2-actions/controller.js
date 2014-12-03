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
      .state('actions.general', {
        url: '/{id:\\w+}/general'
      })
      .state('actions.code', {
        url: '/{id:\\w+}/code'
      })

      ;

  });

angular.module('main')

  .controller('st2ActionsCtrl', function ($scope, st2api, st2LoaderService) {

    $scope.filter = '';

    st2LoaderService.reset();
    st2LoaderService.start();

    var pActionList = st2api.actionOverview.list().then(function (result) {
      st2LoaderService.stop();
      return result;
    }).catch(function (response) {
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
        var index = $scope.history.push({
          execution: execution
        }) - 1;

        $scope.inProgress = true;
        $scope.$apply();

        // Update it until it gets resolved
        st2api.history.watchCollection({
          execution: execution.id
        }, function (records) {
          var record = records[0];

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
