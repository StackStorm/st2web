'use strict';
angular.module('main')
  .directive('st2FormNamespace', function ($timeout) {
    return {
      restrict: 'C',
      require: 'ngModel',
      scope: {
        'spec': '=',
        'options': '=',
        'ngModel': '=',
        'disabled': '='
      },
      templateUrl: 'modules/st2-auto-form/modules/st2-form-namespace/template.html',
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

  })

  .directive('ngNamespaces', function namespaceDirective() {
    return {
      require: '?ngModel',
      restrict: 'A',
      link: function(scope, elm, attrs, ctrl) {
        if (!ctrl) {
          return;
        }

        var namespaces;

        scope.$watch(attrs['ngNamespaces'], function (attribute) {
          namespaces = attribute;
        });

        scope.$watch('ngNamespaces', function () {
          ctrl.$validate();
        });

        ctrl.$validators.namespaces = function (value) {

          if (_.isEmpty(value) || _.isUndefined(namespaces)) {
            return true;
          } else {
            return _.map(namespaces, function(namespace) {
              var name = namespace.name;
              console.log(name);
              var escaped = name.replace(/\./g, '\.');
              return value === name ||
                     new RegExp('^'+escaped+'(\.[a-z0-9]+)*$').test(value);
            }).reduce(function(a, b) {
              return a || b;
            });
          }
        };
      }
    };
  })

  ;
