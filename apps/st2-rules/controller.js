'use strict';
angular.module('main')

  // List rules
  .controller('st2RulesCtrl', function ($scope, st2Api) {
    $scope.rules = st2Api.rules.list();
  })

  // Create new rule
  .controller('st2RuleCreateCtrl', function ($scope) {
    $scope.rule = {};
  })

  // Edit existing rule
  .controller('st2RuleEditCtrl', function ($scope, $state, st2Api, $filter) {
    $scope.rule = $filter('unwrap')(st2Api.rules.get($state.params));
    $scope.hidePopup = true;

    $scope.button = {};
  });
