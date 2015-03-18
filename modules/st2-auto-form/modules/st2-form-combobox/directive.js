'use strict';
angular.module('main')
  .directive('st2FormCombobox', function ($timeout) {
    return {
      restrict: 'C',
      scope: {
        'name': '=',
        'spec': '=',
        'options': '=',
        'result': '=',
        'disabled': '='
      },
      templateUrl: 'modules/st2-auto-form/modules/st2-form-combobox/template.html',
      link: function (scope) {

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

        scope.$watch('result', function (result) {
          scope.rawResult = result;
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
            scope.result = scope.rawResult;
          });
        };

      }
    };

  })

  .directive('ngEnums', function enumDirective() {
    return {
      require: '?ngModel',
      restrict: 'A',
      scope: {
        ngEnums: '='
      },
      link: function(scope, elm, attrs, ctrl) {
        if (!ctrl) {
          return;
        }

        scope.$watch('ngEnums', function () {
          ctrl.$validate();
        });

        ctrl.$validators.enums = function (value) {
          var enums = scope['ngEnums'];
          return _.isEmpty(value) || _.isUndefined(enums) || _.some(enums, {name: value});
        };
      }
    };
  })

  ;
