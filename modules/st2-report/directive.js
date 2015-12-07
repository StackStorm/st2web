/* global Reamaze */
'use strict';

angular.module('main')
  .directive('st2Report', function () {

    return {
      restrict: 'C',
      link: function () {
        Reamaze.reload();
      }
    };

  });
