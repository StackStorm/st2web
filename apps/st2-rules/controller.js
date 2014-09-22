'use strict';
angular.module('main')

  // List actions
  .controller('st2RulesCtrl', function ($scope, st2Api) {
    $scope.rules = st2Api.rules.list();
  })

  ;
