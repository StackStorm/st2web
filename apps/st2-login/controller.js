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
      var expiry = st2api.actions.token.expiry && new Date(st2api.actions.token.expiry)
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
  .controller('st2LoginCtrl', function ($scope, st2api, $rootScope) {

    $scope.submit = function (url, user, password, remember) {
      st2api.authenticate(user, password).then(function (token) {
        if (remember) {
          localStorage.setItem('st2Token', JSON.stringify(token));
        }

        $rootScope.$broadcast('$locationChangeSuccess');
      }).catch(function (err) {
        if (err.status === 0) {
          $scope.error = 'Unknown error. Possible SSL voliation.';
        } else {
          $scope.error = err.message;
        }
        $scope.$apply();
      });
    };

  });
