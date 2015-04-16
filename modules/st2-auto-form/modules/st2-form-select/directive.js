'use strict';
angular.module('main')
  .directive('st2FormSelect', function () {
    return {
      restrict: 'C',
      require: 'ngModel',
      scope: {
        'spec': '=',
        'options': '=',
        'ngModel': '=',
        'disabled': '='
      },
      templateUrl: 'modules/st2-auto-form/modules/st2-form-select/template.html',
      link: function (scope, element, attrs, ctrl) {
        scope.name = ctrl.$name;

        scope.$watch('spec.enum', function (options) {
          scope.enum = _.isArray(options) ? _.zipObject(options, options) : options;
        });

        scope.format = function (type, name) {
          if (type === name) {
            return type;
          } else {
            return name + ' (' + type + ')';
          }
        };
      }
    };

  })

  ;
