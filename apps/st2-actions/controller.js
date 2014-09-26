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
        url: '/:id'
      })
      .state('actions.details', {
        url: '/:id/details'
      })

      ;

  });

angular.module('main')

  .controller('st2ActionsCtrl', function ($scope, st2Api) {
    $scope.actions = st2Api.actions.list();

    $scope.$watch('state.params.id', function (id) {
      $scope.current = id ? st2Api.actions.get({ id: id }) : null;
      $scope.actionexecutions = st2Api.actionExecutions.list({
        'action_id': id
      });
    });

  })

  ;
