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
        url: '?page'
      })
      .state('actions.summary', {
        url: '/{id:\\w+}?page'
      })
      .state('actions.details', {
        url: '/{id:\\w+}/details?page'
      })

      ;

  });

angular.module('main')

  .controller('st2ActionsCtrl', function ($scope, st2Api) {

    $scope._api = st2Api;

    $scope.$watch('_api.actions.list() | unwrap', function (list) {
      $scope.groups = list && _.groupBy(list, 'content_pack');
    });

    $scope.$watch('$root.state.params.page', function (page) {
      st2Api.actions.fetch(page);
    });

    $scope.$watch('$root.state.params.id', function (id) {
      // TODO: figure out why you can't use $filter('unwrap')(...) here
      st2Api.actions.get(id).then(function (action) {
        $scope.action = action;

        $scope.payload = {};

        st2Api.executions.find({
          'action_id': action.id
        }).then(function (executions) {
          $scope.executions = executions;
        });

        if ($scope.actionHasFile(action)) {
          st2Api.actionEntryPoints.get(id).then(function (file) {
            $scope.file = file;
          });
        }

      });
    });

    // Running an action
    $scope.runAction = function (actionName, payload) {
      st2Api.executions.create({
        action: {
          name: actionName
        },
        parameters: payload
      }).then(function (execution) {
        st2Api.executions.find({
          'action_id': execution.action.id
        }).then(function (executions) {
          $scope.executions = executions;
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
