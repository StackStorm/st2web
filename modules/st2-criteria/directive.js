'use strict';

angular.module('main')
  .directive('st2Criteria', function () {

    return {
      restrict: 'C',
      require: 'ngModel',
      scope: {
        ngModel: '=',
        disabled: '=',
        trigger: '='
      },
      templateUrl: 'modules/st2-criteria/template.html',
      link: function postLink(scope, element, attrs, ctrl) {
        scope.ngModel = scope.ngModel || {};

        scope.typeSpec = {
          enum: {
            'matchregex': 'Matches Regex',
            'eq': 'Equals',
            'equals': 'Equals',
            'nequals': 'Not Equals',
            'neq': 'Not Equals',
            'ieq': 'Equals Case Insensitive',
            'iequals': 'Equals Case Insensitive',
            'contains': 'Contains',
            'icontains': 'Contains Case Insensitive',
            'ncontains': 'Not Contains',
            'incontains': 'Not Contains Case Insensitive',
            'startswith': 'Starts With',
            'istartswith': 'Starts With Case Insensitive',
            'endswith': 'Ends With',
            'iendswith': 'Ends With Case Insensitive',
            'lt': 'Less Than',
            'lessthan': 'Less Than',
            'gt': 'Greater Than',
            'greaterthan': 'Greater Than',
            'td_lt': 'Earlier Than',
            'timediff_lt': 'Earlier Than',
            'td_gt': 'Later Than',
            'timediff_gt': 'Later Than'
          },
          required: true
        };

        scope.patternSpec = {
          required: true
        };

        scope.$watch('trigger', function (trigger) {
          scope.autocompleteSpec = {
            required: true
          };

          if (trigger && trigger.payload_schema && trigger.payload_schema.properties) {
            scope.autocompleteSpec.enum =
              _.map(trigger.payload_schema.properties, function (spec, name) {
                return {
                  name: 'trigger.' + name,
                  description: spec.description
                };
              });
          }
        });

        scope.remove = function (criterion) {
          scope.result.splice(scope.result.indexOf(criterion), 1);
        };

        scope.add = function () {
          scope.result.push({});
        };

        ctrl.$render = function () {
          scope.result = _.map(ctrl.$viewValue, function (value, key) {
            return {
              key: key,
              value: value
            };
          });
        };

        scope.$watch('result', function (result) {
          _.each(result, function (criterion) {
            ctrl.$viewValue[criterion.key] = criterion.value;
          });

          _(ctrl.$viewValue)
            .keys()
            .difference(_.pluck(result, 'key'))
            .each(function (key) {
              delete ctrl.$viewValue[key];
            });
        }, true);

      }
    };

  });
