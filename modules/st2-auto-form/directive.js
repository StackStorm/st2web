'use strict';
angular.module('main')
  .directive('st2AutoForm', function () {
    // TODO: figure out what other fields do we need.
    // TODO: create an interface to extend the list of fields.
    var fieldTypes = {
      'string': 'modules/st2-auto-form/fields/input.partial.html',
      'integer': 'modules/st2-auto-form/fields/input.partial.html',
      'number': 'modules/st2-auto-form/fields/input.partial.html',
      'boolean': 'modules/st2-auto-form/fields/checkbox.partial.html',
      'select': 'modules/st2-auto-form/fields/select.partial.html'
    };

    return {
      restrict: 'C',
      scope: {
        'spec': '=',
        'result': '='
      },
      templateUrl: 'modules/st2-auto-form/template.html',
      link: function postLink(scope) {
        scope.getFieldTemplate = function (field) {
          var type;

          if (field.enum) {
            type = 'select';
          } else {
            type = field.type;
          }

          return fieldTypes[type];
        };
      }
    };

  })

  .filter('filterMutable', function () {
    return function (spec) {
      var obj = _.clone(spec);

      _.each(obj, function (field, key) {
        if (field.immutable) {
          delete obj[key];
        }
      });

      return obj;
    };
  });
