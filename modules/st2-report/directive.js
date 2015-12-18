'use strict';

angular.module('main')
  .directive('st2Report', function ($window) {

    return {
      restrict: 'C',
      link: function () {
        $window.Reamaze && $window.Reamaze.reload();
      }
    };

  });
