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
  .controller('MainCtrl', function ($rootScope, $state) {
    $rootScope.state = $state;
    $rootScope._ = _;

    $rootScope.go = function (params) {
      var isList = $rootScope.state.includes('^.list');
      return $rootScope.state.go(isList ? '^.summary' : '.', params);
    };

    // Pagination
    $rootScope.$watch('state.params.page', function (page) {
      $rootScope.page = page && parseInt(page);
    });
    $rootScope.$on('$fetchFinish', function (event, fetch) {
      $rootScope.total_count = parseInt(fetch.response.headers()['x-total-count']);
      $rootScope.limit = parseInt(fetch.response.headers()['x-limit']);
      $rootScope.maxPage = Math.ceil($rootScope.total_count / $rootScope.limit);
    });
    $rootScope.prevPage = function () {
      $rootScope.state.go('.', { page: $rootScope.page - 1 });
    };
    $rootScope.nextPage = function () {
      $rootScope.state.go('.', { page: ($rootScope.page || 1) + 1 });
    };

    $rootScope.isDetails = function () {
      return !$state.includes('^.list') && !$state.includes('^.summary');
    };

    // Filtering
    var filters = ['action', 'trigger_type', 'rule'];

    $rootScope.$watchCollection('state.params', function (params) {
      $rootScope.filters = _.pick(params, filters);
    });

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
      if (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      }
    };
  });
