'use strict';
angular.module('main')

  // List actions
  .controller('st2ActionListCtrl', function ($scope, st2Api) {
    $scope.actions = st2Api.actions.list();
  })

  // Get action
  .controller('st2ActionGetCtrl', function ($scope, st2Api, $stateParams) {
    $scope.current = st2Api.actions.get({ id: $stateParams.id });
  })

  ;
