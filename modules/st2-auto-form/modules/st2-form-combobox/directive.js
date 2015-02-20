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
            scope.result = scope.sample[index].name;
          }
        });

        var timerPromise
          , timeout = 200; // may not be enough
        scope.toggleSuggestions = function (to) {
          $timeout.cancel(timerPromise);
          timerPromise = $timeout(function () {
            scope.showSuggestions = to;
          }, timeout);
        };

      }
    };

  })

  ;
