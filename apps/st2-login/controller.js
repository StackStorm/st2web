'use strict';
angular.module('main')
  .config(function ($stateProvider, $urlRouterProvider) {

    $stateProvider
      .state('login', {
        controller: 'st2LoginCtrl',
        templateUrl: 'apps/st2-login/template.html'
      })
      ;

    $urlRouterProvider.deferIntercept();

  })
  .run(function ($rootScope, $urlRouter, st2api, $state) {

    $rootScope.$on('$locationChangeSuccess', function(e) {
      var expiry = st2api.token.expiry && new Date(st2api.token.expiry)
        , now = new Date()
        ;

      if (now < expiry) {
        return;
      }

      e.preventDefault();

      $state.go('login');
    });

    $urlRouter.listen();

  });


angular.module('main')
  .controller('st2LoginCtrl', function ($scope, st2api, st2Config, $rootScope) {

    $scope.submit = function (url, user, password, remember) {
      st2api.connect(url, user, password, remember).then(function () {
        $rootScope.$broadcast('$locationChangeSuccess');
      }).catch(function (err) {
        if (err.status === 0) {
          $scope.error = 'Unknown error. Possible SSL voliation.';
        } else {
          $scope.error = err.message.faultstring || err.message;
        }
        $scope.$apply();
      });
    };

    $scope.servers = st2Config.hosts;
    $scope.server = $scope.servers[0];

  });
