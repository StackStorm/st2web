'use strict';

angular.module('main')
  .directive('st2Menu', function ($window) {

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
          return url ? _.findKey(scope.serverList, function (e) {
            return e === url;
          }) : 'Mock API';
        };

        scope.setServer = function (server) {
          var url = scope.serverList[server];
          if (url) {
            localStorage.setItem('st2Host', url);
          } else {
            localStorage.removeItem('st2Host');
          }

          $window.location.reload();
        };

        scope.serverList = {
          'Stage 1': '//st2stage001.stackstorm.net:9101',
          'Stage 2': '//st2stage002.stackstorm.net:9101',
          'Stage 3': '//st2stage003.stackstorm.net:9101',
          'Stage 4': '//st2stage004.stackstorm.net:9101',
          'Dev Env': '//172.168.50.50:9101',
          'Mock API': null
        };
      }
    };

  });
