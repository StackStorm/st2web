'use strict';
angular.module('main')
  .directive('st2FormInput', function () {
    return {
      restrict: 'C',
      require: 'ngModel',
      scope: {
        'spec': '=',
        'options': '=',
        'ngModel': '=',
        'disabled': '='
      },
      templateUrl: 'modules/st2-auto-form/modules/st2-form-input/template.html',
      link: function (scope, element, attrs, ctrl) {
        scope.name = ctrl.$name;

        ctrl.$render = function () {
          scope.rawResult = ctrl.$viewValue;
        };

        scope.$watch('rawResult', function (rawResult) {
          ctrl.$setViewValue({
            number: function () {
              return _.isUndefined(rawResult) ? rawResult : parseFloat(rawResult);
            },
            integer: function () {
              return _.isUndefined(rawResult) ? rawResult : parseInt(rawResult);
            },
            string: function () {
              return rawResult;
            }
          }[scope.spec && scope.spec.type || 'string']());
        });
      }
    };

  })

  ;
