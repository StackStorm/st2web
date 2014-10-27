'use strict';

angular.module('main')
  .directive('st2FlexTable', function () {

    return {
      restrict: 'C',
      transclude: true,
      template: '<div ng-transclude></div>',
      link: function postLink(scope, element) {
        scope.toggle = function () {
          element.toggleClass('st2-flex-table--contracted');
        };
      }
    };

  });
