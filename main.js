'use strict';

angular.module('main', ['ui.router', 'ngResource', 'angularMoment']);

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
