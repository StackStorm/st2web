'use strict';

angular.module('main')
  .directive('st2Rule', function () {

    return {
      restrict: 'C',
      scope: {
        rule: '='
      },
      replace: true,
      templateUrl: 'apps/st2-rules/modules/st2-rule/template.html',
      controller: function ($scope, $state, st2Api) {
        $scope.services = st2Api;

        $scope.edit = function (rule) {
          $state.go('ruleEdit', rule);
        };

        $scope.remove = function (rule) {
          st2Api.rules.remove({ id: rule.id });
        };

        $scope.toggle = function (rule) {
          st2Api.rules[rule.enable ? 'deactivate' : 'activate']({ id: rule.id });
        };
      }
    };

  });
