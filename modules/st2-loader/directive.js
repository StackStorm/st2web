'use strict';

angular.module('main')
  .service('st2LoaderService', function ($rootScope) {
    var scope = $rootScope.$new(true);

    scope.counter = 0;

    scope.start = function () {
      scope.counter++;
      scope.$$phase && scope.$apply();
    };

    scope.stop = function () {
      scope.counter--;
      if (scope.counter < 0) {
        scope.counter = 0;
      }
      scope.$$phase && scope.$apply();
    };

    scope.reset = function () {
      scope.counter = 0;
      scope.$$phase && scope.$apply();
    };

    return scope;
  })
  .directive('st2Loader', function (st2LoaderService) {

    return {
      restrict: 'C',
      scope: true,
      link: function postLink(scope, element) {

        st2LoaderService.$watch('counter', function (counter) {
          element.toggleClass('st2-loader--active', !!counter);
        });

      }
    };

  });
