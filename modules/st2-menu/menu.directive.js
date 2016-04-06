'use strict';

var template = require('./template.html');

module.exports =
  function st2Menu($window, st2api) {

    return {
      restrict: 'C',
      scope: true,
      templateUrl: template,
      link: function postLink(scope) {
        scope.isMain = function (e) {
          return !!e.title;
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
