'use strict';
angular.module('main')
  .config(function ($stateProvider) {
    $stateProvider
      .state('actions', {
        abstract: true,
        url: '/actions',
        icon: 'st2-icon__actions',
        controller: 'st2ActionsCtrl',
        templateUrl: 'apps/st2-actions/template.html',
        title: 'Actions',
        position: 2
      })
      .state('actions.list', {
        url: ''
      })
      .state('actions.general', {
        url: '/{ref:[\\w.]+}/general'
      })
      .state('actions.code', {
        url: '/{ref:[\\w.]+}/code'
      })

      ;

  });

angular.module('main')

  .controller('st2ActionsCtrl', function ($scope, st2api, st2LoaderService) {

    $scope.filter = '';
    $scope.error = null;

    st2LoaderService.reset();
    st2LoaderService.start();

    var pActionList = st2api.actionOverview.list().then(function (result) {
      st2LoaderService.stop();
      return result;
    }).catch(function (err) {
      $scope.groups = [];
      $scope.error = err.message;

      console.error('Failed to fetch the data: ', err);
      st2LoaderService.stop();

      $scope.$apply();
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

    $scope.$watch('$root.state.params.ref', function (ref) {
      var promise = ref ? st2api.actionOverview.get(ref) : pActionList.then(function (actions) {
        return _.first(actions);
      });

      promise.then(function (action) {
        $scope.action = action;

        $scope.payload = {};
        $scope.inProgress = true;

        st2api.history.list({
          'action': $scope.$root.getRef(action),
          'limit': 5,
          'parent': 'null'
        }).then(function (history) {
          $scope.inProgress = false;

          $scope.history = history;

          $scope.$apply();
        });

        if ($scope.actionHasFile(action)) {
          st2api.actionEntryPoint.get(action.ref).then(function (file) {
            $scope.file = file;
            $scope.$apply();
          }).catch(function (err) {
            console.error(err);
          });
        }

        $scope.$apply();
      });
    });

    st2api.stream.listen().then(function (source) {

      // TODO: We rather want to receive history records and not action
      // executions here, but it would require us to create another queue on
      // backend.
      source.addEventListener('st2.actionexecution__create', function (e) {
        var execution = JSON.parse(e.data);

        if (execution.action === $scope.action.ref) {
          $scope.history.push({
            execution: execution
          });
          $scope.$apply();
        }
      });

      source.addEventListener('st2.actionexecution__update', function (e) {
        var execution = JSON.parse(e.data);
        if (execution.action === $scope.action.ref) {
          var record = _.find($scope.history, {
            'execution': { 'id': execution.id }
          });
          record.execution = execution;
          $scope.$apply();
        }
      });

    });

    // Running an action
    $scope.runAction = function (action, payload) {
      st2api.actionExecutions.create({
        action: $scope.$root.getRef(action),
        parameters: payload
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
