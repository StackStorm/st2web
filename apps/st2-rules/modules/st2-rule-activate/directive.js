'use strict';

angular.module('main')
  .directive('st2RuleActivate', function () {

    return {
      restrict: 'C',
      scope: {
        rule: '='
      },
      templateUrl: 'apps/st2-rules/modules/st2-rule-activate/template.html',
      controller: function ($scope, $state, st2Api) {
        $scope.formSpec = [{
          key: 'name',
          type: 'text',
          label: 'Name',
          required: true
        }, {
          key: 'desc',
          type: 'textarea',
          label: 'Description'
        }];

        $scope.formResults = {};

        $scope.$watch('rule', function (options) {
          $scope.formResults = options ? _.clone(options) : {};
        });

        $scope.submit = function (enable) {
          $scope.rule.name = _.clone($scope.formResults.name);
          $scope.rule.description = _.clone($scope.formResults.desc);

          if (!_.isUndefined(enable)) {
            $scope.rule.enable = !!enable;
          }

          if ($scope.form.$valid) {
            if ($scope.rule.id) {
              st2Api.rules.update({ id: $scope.rule.id }, $scope.rule);
            } else {
              st2Api.rules.create($scope.rule);
            }

            $state.go('rules');
          }
        };
      }
    };

  });
