'use strict';

angular.module('main')
  .directive('st2RulePopup', function () {

    return {
      restrict: 'C',
      scope: {
        type: '@',
        rule: '='
      },
      templateUrl: 'apps/st2-rules/modules/st2-rule-popup/template.html',
      controller: function ($scope, st2Api) {
        $scope.inventory = st2Api;

        $scope.pick = function (entity) {
          if ($scope.type === 'trigger') {
            $scope.rule['trigger_type'] = { name: entity.name };
          } else {
            $scope.rule[$scope.type] = { type: entity.name };
          }

          if ($scope.rule['trigger_type'] && $scope.rule.action) {
            $scope.$parent.popup = null;
          } else {
            $scope.$parent.popup = $scope.type === 'trigger' ? 'action' : 'trigger';
          }
        };
      }
    };

  });
