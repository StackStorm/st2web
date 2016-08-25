'use strict';

var template = require('./template.html');

module.exports =
  function st2Menu($window, st2api) {

    return {
      restrict: 'C',
      scope: true,
      templateUrl: template,
      link: function postLink(scope) {
        scope.routes = scope.state.get().map(route => {
          return Object.assign(route, {
            href: route.href || `#${route.url}`
          });
        });

        scope.isMain = function (e) {
          return !!e.icon;
        };

        scope.position = function (e) {
          return e.position;
        };

        scope.isActive = function (e) {
          return scope.state.includes(e);
        };

        scope.user = st2api.token.user;
        scope.server = st2api.server;

        scope.disconnect = function () {
          st2api.disconnect();
          $window.location.reload();
        };
      }
    };

  };
