'use strict';
angular.module('main')
  .directive('st2AutoForm', function ($templateRequest, $compile) {
    // TODO: figure out what other fields do we need.
    // TODO: create an interface to extend the list of fields.
    var getFieldClass = function (field) {
      var type = field.type;

      if (field.enum) {
        type = 'select';
      }

      return {
        'string': 'st2-form-input',
        'integer': 'st2-form-input',
        'number': 'st2-form-input',
        'boolean': 'st2-form-checkbox',
        'select': 'st2-form-select',
        'array': 'st2-form-array',
        'object': null
      }[type];
    };

    var pTemplate = $templateRequest('modules/st2-auto-form/template.html');

    return {
      restrict: 'C',
      require: 'ngModel',
      scope: {
        'spec': '=',
        'ngModel': '=',
        'disabled': '='
      },
      link: function postLink(scope, element, attrs, ngModel) {
        ngModel.$render = function () {
          scope.result = ngModel.$viewValue;
        };

        var scopes = [];

        scope.$watch('spec', function (spec) {
          element.empty();

          _.remove(scopes, function (scope) {
            scope.$destroy();
            return true;
          });

          spec && pTemplate.then(function (template) {
            var tmplElement = angular.element(template);

            _(spec.properties)
              .map(function (value, key) {
                value._name = key;
                return value;
              })
              .reject('immutable')
              .sortBy('position')
              .each(function (field) {
                var cls = getFieldClass(field);

                if (!cls) {
                  return;
                }

                var fieldElement = tmplElement.clone();
                fieldElement.addClass(cls);

                var innerScope = scope.$new();
                innerScope.name = field._name;
                innerScope.field = field;
                scopes.push(innerScope);

                element.append($compile(fieldElement)(innerScope));
              });
          });
        });
      }
    };

  })

  ;
