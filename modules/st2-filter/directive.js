'use strict';

angular.module('main')
  .directive('st2Filter', function ($parse) {

    return {
      restrict: 'C',
      scope: {
        label: '@label',
        multiple: '@',
        items: '=',
        activeItemsSrc: '=activeItems'
      },
      templateUrl: 'modules/st2-filter/template.html',
      link: function postLink(scope, element, attrs) {
        var onChange = $parse(attrs.onChange);
        var listElement = element[0].getElementsByClassName('st2-filter__list')[0];
        var searchBarElement = element[0].getElementsByClassName('st2-filter__search-bar')[0];

        scope.refreshItemsToShow = function () {
          var activeItems = scope.activeItems.filter(function (item) {
            return !scope.search || item.indexOf(scope.search) !== -1;
          });
          var otherItems = scope.items.filter(function (item) {
            return scope.activeItems.indexOf(item) === -1 &&
                   (!scope.search || item.indexOf(scope.search) !== -1);
          }).sort();

          scope.itemsToShow = activeItems.concat(otherItems);
        };

        scope.toggle = function () {
          listElement.scrollTop = 0;
          scope.search = '';
          scope.refreshItemsToShow();
          element.toggleClass('st2-filter--active');
          searchBarElement.style.minWidth = searchBarElement.clientWidth + 'px';
          searchBarElement.focus();
        };

        scope.pick = function (name) {
          var activeItems = scope.activeItems.concat();
          var index = activeItems.indexOf(name);

          if (index > -1) {
            activeItems.splice(index, 1);
          } else if (scope.multiple) {
            activeItems.push(name);
          } else {
            activeItems = [name];
          }

          scope.activeItems = activeItems;
          onChange(scope, scope.activeItems);
        };

        scope.clear = function () {
          scope.activeItems = [];
          scope.toggle();
          onChange(scope, scope.activeItems);
        };

        scope.$watch('activeItemsSrc', function (activeItems) {
          if (typeof activeItems === 'undefined') {
            scope.activeItems = [];
          } else if (Array.isArray(activeItems)) {
            scope.activeItems = activeItems.concat();
          } else {
            scope.activeItems = [activeItems];
          }
        });

        scope.$watch('activeItems', function (activeItems) {
          activeItems.sort();
        });

        scope.$watch('search', scope.refreshItemsToShow);
      }
    };

  });
