'use strict';

angular.module('main', ['ui.router', 'ngResource', 'angularMoment', 'ui.select'])
  .config(function ($urlRouterProvider) {

    // Remove tailing slash from url before looking for state
    $urlRouterProvider.rule(function ($injector, $location) {
      var path = $location.url();

      // check to see if the path already has a slash where it should be
      if (path[path.length - 1] === '/') {
        return path.substr(0, path.length - 1);
      }

      if (path.indexOf('/?') > -1) {
        return path.replace('/?', '?');
      }
    });

  });

angular.module('main')
  .controller('MainCtrl', function ($scope, $state) {
    $scope.state = $state;
    $scope._ = _;

    // Don't forget to add a target for every href in menu
    // $scope.$on('$stateChangeStart', function (event, toState) {
    //   window.name = toState.name;
    // });
  });

angular.module('main')
  .filter('has', function () {
    return function (input, name) {
      return _.filter(input, function (e) {
        return !!e[name];
      });
    };
  });

angular.module('main')
  .filter('capitalize', function () {
    return function (string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    };
  });
