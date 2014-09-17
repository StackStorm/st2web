'use strict';

angular.module('main')
  .directive('st2Iterator', function () {

    return {
      restrict: 'E',
      transclude: true,
      templateUrl: 'apps/st2-docs/modules/st2-iterator/template.html'
    };

  });
