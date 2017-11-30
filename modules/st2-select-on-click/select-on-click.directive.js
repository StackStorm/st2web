'use strict';

module.exports =
  function selectOnClick($window) {
    return {
      restrict: 'A',
      link: function (scope, element) {
        element.on('click', function () {
          var range = document.createRange();
          range.selectNodeContents(this);
          var sel = $window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        });
      },
    };
  };
