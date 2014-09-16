'use strict';

angular.module('main')
  .directive('st2RulePicker', function () {

    return {
      restrict: 'C',
      scope: {
        originalRule: '=rule',
        hidePopup: '='
      },
      templateUrl: 'apps/st2-rules/modules/st2-rule-picker/template.html',
      controller: function ($scope, st2Api) {
        $scope.inventory = st2Api;

        $scope.popup = $scope.hidePopup ? null : 'trigger';

        $scope.rule = {};

        if ($scope.originalRule && $scope.originalRule.$promise) {
          $scope.originalRule.$promise.then(function (rule) {
            $scope.rule = _.clone(rule);
          });
        }

        $scope.submit = function () {
          $scope.originalRule = _.clone($scope.rule);
          $scope.originalRule.criteria = undefined;
          $scope.originalRule.action.mapping = undefined;
        };
      }
    };

  });
