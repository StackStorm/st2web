'use strict';

var _ = require('lodash')
  ;

var template = require('./template.html');

module.exports =
  function st2FormSelect() {
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

  };
