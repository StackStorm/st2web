'use strict';

angular.module('main')
  .directive('flowLink', function (st2api) {

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
        if (st2api.server.flow) {
          scope.flow_token = token;
          scope.flow_url = st2api.server.flow;
        } else {
          element.remove();
        }
      },
      templateUrl: 'modules/st2-flow/template.html'
    };

  });

// TODO: auth
// TODO: action
