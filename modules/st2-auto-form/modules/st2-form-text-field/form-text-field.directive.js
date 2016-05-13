'use strict';

var template = require('./template.html');

module.exports =
  function st2FormTextField() {
    var minRows = 1
      , maxRows = 3;

    return {
      restrict: 'C',
      require: 'ngModel',
      scope: {
        'name': '@title',
        'spec': '=',
        'options': '=',
        'ngModel': '=',
        'disabled': '='
      },
      templateUrl: template,
      link: function (scope, $element, attrs, ctrl) {
        var field = $element[0].querySelector('.st2-auto-form__field');
        var computed = window.getComputedStyle(field);
        var lineHeight = parseInt(computed.lineHeight);
        var paddings = parseInt(computed.paddingTop) + parseInt(computed.paddingBottom);
        var minHeight = paddings + minRows * lineHeight;
        var maxHeight = paddings + maxRows * lineHeight;
        field.style.minHeight = minHeight + 'px';
        field.style.maxHeight = maxHeight + 'px';

        if (!scope.name) {
          scope.name = ctrl.$name;
        }

        function recalculate() {
          setTimeout(function () {
            field.style.height = 0;
            field.style.height = field.scrollHeight + 'px';
          }, 0);
        }

        scope.$watch('ngModel', recalculate);
        angular.element(field).on('input', recalculate);
      }
    };

  };
