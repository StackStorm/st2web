'use strict';

angular.module('main')
  .directive('st2Criteria', function () {

    return {
      restrict: 'C',
      require: 'ngModel',
      scope: {
        ngModel: '=',
        disabled: '=',
        trigger: '='
      },
      templateUrl: 'modules/st2-criteria/template.html',
      link: function postLink(scope) {
        scope.ngModel = scope.ngModel || {};

        scope.$watch('trigger', function (trigger) {
          if (trigger && trigger.payload_schema && trigger.payload_schema.properties) {
            scope.autocompleteSpec = {
              enum: _.map(trigger.payload_schema.properties, function (spec, name) {
                return {
                  name: 'trigger.' + name,
                  description: spec.description
                };
              })
            };
          } else {
            scope.autocompleteSpec = {};
          }
        });

        scope.remove = function (key) {
          delete scope.ngModel[key];
        };

        scope.add = function () {
          scope.ngModel[''] = {};
        };
      }
    };

  })
  .controller('st2CriterionCtrl', function ($scope) {

    $scope.$watch('key', function (key, oldKey) {
      if (key !== oldKey) {
        $scope.$parent.ngModel[key] = $scope.$parent.ngModel[oldKey];
        delete $scope.$parent.ngModel[oldKey];
      }
    });

  });
