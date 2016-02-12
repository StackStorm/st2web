'use strict';

module.exports =
  function st2ScrollIntoView() {
    return {
      restrict: 'A',
      scope: {
        enabled: '@st2ScrollIntoView',
        container: '@st2ScrollIntoViewContainer'
      },
      link: function (scope, element) {
        var container = document.getElementById(scope.container);

        scope.$watch('enabled', function(enabled) {
          if (enabled === 'false') {
            return;
          }

          // Immediate and requestAnimationFrame height checks give wrong results
          setTimeout(function() {
            var elementOffset = element[0].getBoundingClientRect();
            var containerOffset = container.getBoundingClientRect();
            var topDiff = elementOffset.top - containerOffset.top;
            var bottomDiff = topDiff + elementOffset.height - containerOffset.height;

            if (topDiff < 0) {
              container.scrollTop += topDiff;
            } else if (bottomDiff > 0) {
              container.scrollTop += bottomDiff;
            }
          });
        });
      }
    };
  };
