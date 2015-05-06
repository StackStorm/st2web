'use strict';

angular.module('main')
  .directive('st2FlexTable', function () {

    return {
      restrict: 'C',
      transclude: true,
      template: '<div ng-transclude></div>'
    };

  });
