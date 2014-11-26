'use strict';

angular.module('main')
  .directive('st2Filter', function () {

    return {
      restrict: 'C',
      scope: {
        type: '@',
        label: '@',
        filters: '='
      },
      templateUrl: 'modules/st2-filter/template.html',
      link: function postLink(scope, element) {
        scope.toggle = function () {
          element.toggleClass('st2-filter--active');
        };

        scope.pick = function (name) {
          var o = _.clone(scope.$root.state.params);

          o[scope.type] = o[scope.type] === name ? void 0 : name;

          scope.$root.state.go('.', o);
          scope.toggle();
        };
      }
    };

  });
