'use strict';

var _ = require('lodash')
  ;

var template = require('./template.html');

module.exports =
  function st2FormCombobox($timeout) {
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

        var selected = 0;
        Object.defineProperty(scope, 'selected', {
          get: function () {
            if (!scope.sample) {
              return 0;
            } else {
              return selected < scope.sample.length ? selected : scope.sample.length - 1;
            }
          },
          set: function (index) {
            selected = index;
          }
        });

        scope.choose = function (index) {
          if (_.isUndefined(index)) {
            index = scope.selected;
          } else {
            scope.selected = index;
          }

          scope.rawResult = scope.sample[index].name;
        };

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

        scope.keydown = function ($event) {
          scope.focus();

          if ($event.keyCode === 38) {
            $event.preventDefault();
            scope.selected = scope.selected - 1;
          }

          if ($event.keyCode === 40) {
            $event.preventDefault();
            scope.selected = scope.selected + 1;
          }

          if ($event.keyCode === 13) {
            $event.preventDefault();
            scope.choose();
            scope.blur();
          }
        };

      }
    };

  };
