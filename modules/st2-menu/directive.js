'use strict';

angular.module('main')
  .directive('st2Menu', function ($window, st2Config) {

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

        scope.getServer = function () {
          var url = localStorage.getItem('st2Host');
          var host = _.find(scope.serverList, {url: url}) || _.first(scope.serverList);

          return host.name;
        };

        scope.setServer = function (server) {
          if (server.url) {
            localStorage.setItem('st2Host', server.url);
          } else {
            localStorage.removeItem('st2Host');
          }

          $window.location.reload();
        };

        scope.serverList = st2Config.hosts;
      }
    };

  });
