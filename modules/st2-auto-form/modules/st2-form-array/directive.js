'use strict';
angular.module('main')
  .directive('st2FormArray', function () {
    return {
      restrict: 'C',
      scope: {
        'name': '=',
        'spec': '=',
        'result': '=',
        'disabled': '='
      },
      templateUrl: 'modules/st2-auto-form/modules/st2-form-array/template.html',
      link: function postLink(scope) {

        scope._value = (scope.result || []).join(', ');

        scope.$watch('_value', function (value) {
          scope.result = _(value.split(',')).map(function (e) {
            return e.trim();
          }).value();
        });

      }
    };

  })

  ;
