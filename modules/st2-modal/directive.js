'use strict';

angular.module('main')
  .directive('st2Modal', function () {

    return {
      restrict: 'C',
      transclude: true,
      templateUrl: 'modules/st2-modal/template.html'
    };

  });
