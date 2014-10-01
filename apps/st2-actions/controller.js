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

  .controller('st2ActionsCtrl', function ($scope, st2Api) {

    // Fetching the data
    $scope.actions = st2Api.actions.list();

    function fetchExecutions(actionId) {
      var executions = st2Api.actionExecutions.list({
        'action_id': actionId
      });

      executions.$promise.then(function (executions) {
        $scope.current.lastStatus = executions.length && _.last(executions).status;
      });

      return executions;
    }

    function fetchOne(id) {

      $scope.current = {};
      $scope.current.payload = {};

      $scope.current.action = st2Api.actions.get({ id: id });
      $scope.current.actionexecutions = fetchExecutions(id);

      $scope.current.action.$promise.then(function (action) {
        return st2Api.runnertypes.get({ name: action['runner_type'] }).$promise;
      }).then(function (runnerType) {
        _.extend($scope.current.action.parameters, runnerType['runner_parameters']);
      });
    }

    $scope.$watch('state.params.id', function (id) {
      if (id) {
        fetchOne(id);
      } else {
        $scope.actions.$promise.then(function (actions) {
          var id = actions && actions[0] && actions[0].id;
          fetchOne(id);
        });
      }
    });

    // Running an action
    $scope.runAction = function (actionName, payload) {
      st2Api.actionExecutions.create({
        action: {
          name: actionName
        },
        parameters: payload
      }).$promise.then(function (execution) {
        $scope.current.actionexecutions = fetchExecutions(execution.action.id);
      });
    };

  })

  ;
