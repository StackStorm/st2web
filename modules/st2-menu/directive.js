'use strict';

angular.module('main')
  .directive('st2Menu', function ($window, st2api) {

    return {
      restrict: 'C',
      scope: true,
      templateUrl: 'modules/st2-menu/template.html',
      link: function postLink(scope) {
        scope.isMain = function (e) {
          return !!e.title;
        };

        scope.isActive = function (e) {
          return scope.state.includes(e);
        };

        scope.user = st2api.token.user;

        scope.disconnect = function () {
          st2api.disconnect();
          $window.location.reload();
        };
      }
    };

  });
