'use strict';

module.exports =
  function st2FormArray() {
    return {
      restrict: 'C',
      require: 'ngModel',
      scope: {
        'spec': '=',
        'options': '=',
        'ngModel': '=',
        'disabled': '='
      },
      templateUrl: 'modules/st2-auto-form/modules/st2-form-array/template.html',
      link: function (scope, element, attrs, ctrl) {
        scope.name = ctrl.$name;
      }
    };

  };
