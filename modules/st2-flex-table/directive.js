'use strict';

angular.module('main')
  .directive('st2FlexTable', function () {

    return {
      restrict: 'C',
      scope: true,
      transclude: true,
      link: function postLink(scope, element, attrs, ctrl, transclude) {
        var toggleClass = function (value) {
          element.toggleClass('st2-flex-table--collapsed', value);
        };

        scope.id = attrs.st2FlexTableId;
        scope.toggle = function () {
          toggleClass();
          scope.$emit('toggleFlexTable', scope.id);
        };

        scope.$on('toggleFlexTables', scope.toggle);
        attrs.$observe('st2FlexTableCollapsed', function (value) {
          toggleClass(value === 'true');
        });

        toggleClass(attrs.st2FlexTableCollapsed === 'true');
        transclude(scope, function (clone) {
          element.append(clone);
        });
      }
    };

  });
