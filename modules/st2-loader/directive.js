'use strict';

angular.module('main')
  .directive('st2Loader', function ($rootScope) {

    return {
      restrict: 'C',
      scope: true,
      link: function postLink(scope, element) {
        var counter = 0;

        $rootScope.$on('$fetchStart', function () {
          counter += 1;
          element.toggleClass('st2-loader--active', true);
        });
        $rootScope.$on('$fetchFinish', function () {
          counter -= 1;
          if (!counter) {
            element.toggleClass('st2-loader--active', false);
          }
        });
      }
    };

  });
