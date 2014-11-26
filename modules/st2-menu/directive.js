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
          return url ? _.find(scope.serverList, function (e) {
            return e.url === url;
          }).name : 'Mock API';
        };

        scope.setServer = function (server) {
          if (server.url) {
            localStorage.setItem('st2Host', server.url);
          } else {
            localStorage.removeItem('st2Host');
          }

          $window.location.reload();
        };

        scope.serverList = [{
          name: 'Stage 1',
          url: '//st2stage001.stackstorm.net:9101/v1'
        }, {
          name: 'Stage 2',
          url: '//st2stage002.stackstorm.net:9101/v1'
        }, {
          name: 'Stage 3',
          url: '//st2stage003.stackstorm.net:9101/v1'
        }, {
          name: 'Stage 4',
          url: '//st2stage004.stackstorm.net:9101/v1'
        }, {
          name: 'Dev Env',
          url: '//172.168.50.50:9101/v1'
        }, {
          name: 'Mock API'
        }];
      }
    };

  });
