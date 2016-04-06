'use strict';

module.exports =
  function ngSuggestions() {
    return {
      require: '?ngModel',
      restrict: 'A',
      link: function(scope, elm, attrs, ctrl) {
        if (!ctrl) {
          return;
        }

        var suggestions;

        scope.$watch(attrs['ngSuggestions'], function (attribute) {
          suggestions = attribute;
        });

      }
    };
  };
