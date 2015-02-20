'use strict';
angular.module('main')
  .directive('st2FormInput', function () {
    return {
      restrict: 'C',
      scope: {
        'name': '=',
        'spec': '=',
        'options': '=',
        'result': '=',
        'disabled': '='
      },
      templateUrl: 'modules/st2-auto-form/modules/st2-form-input/template.html',
      link: function (scope) {
        scope.rawResult = scope.result;

        scope.$watch('result', function (result) {
          scope.rawResult = result;
        });

        scope.$watch('rawResult', function (rawResult) {
          scope.result = {
            number: function () {
              return _.isUndefined(rawResult) ? rawResult : parseFloat(rawResult);
            },
            integer: function () {
              return _.isUndefined(rawResult) ? rawResult : parseInt(rawResult);
            },
            string: function () {
              return rawResult;
            }
          }[scope.spec && scope.spec.type || 'string']();
        });
      }
    };

  })

  ;
