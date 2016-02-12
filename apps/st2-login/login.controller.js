'use strict';

module.exports =
  function st2LoginCtrl($scope, st2api, st2Config, $rootScope, $urlRouter) {

    $scope.connect = function (server, user, password, remember) {
      st2api.connect(server, user, password, remember).then(function () {
        $urlRouter.sync();
        $scope.$$phase || $scope.$apply();
      }).catch(function (err) {
        $scope.error = err.message.faultstring || err.message;

        $scope.$apply();
      });
    };

    $scope.displayAuth = function (v) {
      return v.auth ? '* ' + v.name : v.name;
    };

    $scope.servers = st2Config.hosts;
    $scope.server = $scope.servers && $scope.servers[0] || { auth: true };

    $scope.remember = true;

  };
