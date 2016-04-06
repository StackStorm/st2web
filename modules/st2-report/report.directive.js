'use strict';

module.exports =
  function st2Report($window) {

    return {
      restrict: 'C',
      link: function () {
        $window.Reamaze && $window.Reamaze.reload && $window.Reamaze.reload();
      }
    };

  };
