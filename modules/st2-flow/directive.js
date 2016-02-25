'use strict';

angular.module('main')
  .directive('flowLink', function (st2api, st2Config) {

    var parameters = {
      'api': st2api.server.url,
      'auth': st2api.server.auth,
      'token': st2api.token
    };

    var token = btoa(JSON.stringify(parameters)).replace(/=/g, '');

    return {
      restrict: 'E',
      scope: {
        action: '@'
      },
      link: function (scope, element) {
        if (st2api.server.flow || st2Config.flow) {
          scope.flow_token = token;
          scope.flow_url = st2api.server.flow || st2Config.flow;

          var target = 'st2flow+' + st2api.client.index.url;

          scope.$watch('action', function (action) {
            scope.target = target + (action ? '+' + action : '');
          });
        } else {
          element.remove();
        }
      },
      templateUrl: 'modules/st2-flow/template.html'
    };

  });

// TODO: auth
// TODO: action
