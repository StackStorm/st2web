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
    $scope.actions = st2Api.actions.list();

    function fetchOne(id) {
      $scope.current = st2Api.actions.get({ id: id });
      $scope.actionexecutions = st2Api.actionExecutions.list({
        'action_id': id
      });

      $scope.current.$promise.then(function (action) {
        st2Api.runnertypes
          .get({ name: action['runner_type'] })
          .$promise.then(function (runnerType) {
            _.extend($scope.current.parameters, runnerType['runner_parameters']);
          });
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

  })

  ;
