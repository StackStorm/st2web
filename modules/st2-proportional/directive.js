'use strict';

angular.module('main')
  .directive('st2Proportional', function ($window) {

    return {
      restrict: 'C',
      link: function postLink(scope, element) {
        var debouncedMakeProportional = _.debounce(makeProportional, 200).bind(null, element);

        scope.$watch(function() {
          return element[0].clientWidth;
        }, debouncedMakeProportional);

        angular.element($window).on('resize', debouncedMakeProportional);
      }
    };

    function makeProportional(container) {
      var children = Array.prototype.slice.call(container.children());
      var containerStyle = getComputedStyle(container[0]);
      var childrenWidth = 0;
      var childrenByWidth = children.map(function(child) {
        var childWidth;

        if (child.style.width) {
          child.style.width = '';
        }

        childWidth = child.offsetWidth;
        childrenWidth += childWidth;
        return {
          element: child,
          width: childWidth
        };
      });
      var containerWidth = container[0].clientWidth -
                           parseInt(containerStyle.getPropertyValue('padding-left'), 10) -
                           parseInt(containerStyle.getPropertyValue('padding-right'), 10);
      var childrenToShrink = [];
      var nextChild, freeSpace, newWidth;

      if (childrenWidth <= containerWidth) {
        return;
      }

      childrenByWidth.sort(function(a, b) {
        return b.width - a.width;
      });

      while (childrenToShrink.length < children.length &&
             childrenWidth > containerWidth) {

        childrenToShrink.push(childrenByWidth[childrenToShrink.length]);
        nextChild = childrenByWidth[childrenToShrink.length];
        newWidth = nextChild ? nextChild.width : containerWidth / children.length;

        /*jshint loopfunc: true */
        childrenToShrink.forEach(function(child) {
          child.width = newWidth;
        });
        childrenWidth = childrenByWidth.reduce(function(childrenWidth, child) {
          return childrenWidth + child.width;
        }, 0);
      }

      freeSpace = (containerWidth - childrenWidth) / childrenToShrink.length;
      childrenToShrink.forEach(function(child) {
        // Currently only works with box-sizing: border-box
        child.element.style.width = (child.width + freeSpace) + 'px';
      });
    }
  });
