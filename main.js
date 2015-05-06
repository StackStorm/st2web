'use strict';

angular.module('main', ['ui.router', 'angularMoment', 'ngSanitize', 'cgBusy'])
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
  .value('cgBusyDefaults',{
    backdrop: false,
    delay: 1000,
    templateUrl: 'modules/st2-panel/loader.html'
  });

angular.module('main')
  .controller('MainCtrl', function ($rootScope, $state) {
    $rootScope.state = $state;
    $rootScope._ = _;

    $rootScope.go = function (params, opts) {
      var isList = $rootScope.state.includes('^.list');
      return $rootScope.state.go(isList ? '^.general' : '.', params, opts);
    };

    $rootScope.isState = function (states) {
      return _.some([].concat(states), function (state) {
        return $rootScope.state.includes(state);
      });
    };

    // Pagination
    $rootScope.$watch('state.params.page', function (page) {
      $rootScope.page = page && parseInt(page);
    });
    $rootScope.$on('$fetchFinish', function (event, fetch) {
      $rootScope.total_count = fetch.total;
      $rootScope.limit = fetch.limit;
      $rootScope.maxPage = Math.ceil($rootScope.total_count / $rootScope.limit);
    });
    $rootScope.prevPage = function () {
      $rootScope.state.go('.', { page: $rootScope.page - 1 });
    };
    $rootScope.nextPage = function () {
      $rootScope.state.go('.', { page: ($rootScope.page || 1) + 1 });
    };

    // Filtering
    var filters = ['status', 'action', 'trigger_type', 'rule'];

    $rootScope.$watchCollection('state.params', function (params) {
      $rootScope.active_filters = _.pick(params, filters);
    });

    // References
    $rootScope.getRef = function (entity) {
      return entity && [entity.pack, entity.name].join('.');
    };

    // Don't forget to add a target for every href in menu
    // $scope.$on('$stateChangeStart', function (event, toState) {
    //   window.name = toState.name;
    // });

    $rootScope.tabs = (function () {
      var closed = {
        action: [],
        history: [],
        rules: []
      };

      return {
        toggle: function (type, name) {
          var index = closed[type].indexOf(name);

          if (index > -1) {
            closed[type].splice(index, 1);
          } else {
            closed[type].push(name);
          }
        },
        isClosed: function (type, name) {
          return closed[type].indexOf(name) !== -1;
        }
      };
    })();
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
