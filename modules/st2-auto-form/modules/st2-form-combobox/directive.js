'use strict';
angular.module('main')
  .directive('st2FormCombobox', function ($timeout) {
    return {
      restrict: 'C',
      require: 'ngModel',
      scope: {
        'spec': '=',
        'options': '=',
        'ngModel': '=',
        'disabled': '='
      },
      templateUrl: 'modules/st2-auto-form/modules/st2-form-combobox/template.html',
      link: function (scope, element, attrs, ctrl) {
        scope.name = ctrl.$name;

        var selected = 0;
        Object.defineProperty(scope, 'selected', {
          get: function () {
            return selected < scope.sample.length ? selected : scope.sample.length - 1;
          },
          set: function (index) {
            selected = index;
            scope.rawResult = scope.sample[index].name;
          }
        });


        var timerPromise
          , timeout = 200; // may not be enough
        scope.toggleSuggestions = function (to) {
          $timeout.cancel(timerPromise);
          timerPromise = $timeout(function () {
            scope.showSuggestions = to;
          }, timeout);
          return timerPromise;
        };

        scope.focus = function () {
          return scope.toggleSuggestions(true);
        };

        scope.blur = function () {
          return scope.toggleSuggestions(false).then(function () {
            ctrl.$setViewValue(scope.rawResult);
          });
        };

        ctrl.$render = function () {
          scope.rawResult = ctrl.$viewValue;
        };

      }
    };

  })

  .directive('ngEnums', function enumDirective() {
    return {
      require: '?ngModel',
      restrict: 'A',
      link: function(scope, elm, attrs, ctrl) {
        if (!ctrl) {
          return;
        }

        var enums;

        scope.$watch(attrs['ngEnums'], function (attribute) {
          enums = attribute;
        });

        scope.$watch('ngEnums', function () {
          ctrl.$validate();
        });

        ctrl.$validators.enums = function (value) {
          return _.isEmpty(value) || _.isUndefined(enums) || _.some(enums, {name: value});
        };
      }
    };
  })

  ;
