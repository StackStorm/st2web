'use strict';
angular.module('main')
  .directive('st2AutoForm', function () {
    // TODO: figure out what other fields do we need.
    // TODO: create an interface to extend the list of fields.
    var fieldTypes = {
      'string': 'st2-form-input',
      'integer': 'st2-form-input',
      'number': 'st2-form-input',
      'boolean': 'st2-form-checkbox',
      'select': 'st2-form-select',
      'array': 'st2-form-array',
      'object': null
    };

    return {
      restrict: 'C',
      require: 'ngModel',
      scope: {
        'rawSpec': '=spec',
        'ngModel': '=',
        'disabled': '='
      },
      templateUrl: 'modules/st2-auto-form/template.html',
      link: function postLink(scope, element, attrs, ngModel) {
        ngModel.$render = function () {
          scope.result = ngModel.$viewValue;
        };

        // Making input spec an array of key-value to be able to use angular filters
        scope.$watch('rawSpec', function () {
          scope.spec = _.map(scope.rawSpec, function (v, k) {
            return {
              name: k,
              field: v
            };
          });
        });

        // Predefined filters
        scope.MUTABLE = function (item) {
          return !item.field.immutable;
        };

        scope.POSITION = function (item) {
          return item.field.position;
        };

        // Partial router
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
  })

  ;
