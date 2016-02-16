'use strict';

var template = require('./template.html');

module.exports =
  function st2FormCheckbox() {
    return {
      restrict: 'C',
      require: 'ngModel',
      scope: {
        'spec': '=',
        'options': '=',
        'ngModel': '=',
        'disabled': '='
      },
      templateUrl: template,
      link: function (scope, element, attrs, ctrl) {
        scope.name = ctrl.$name;
      }
    };

  };
