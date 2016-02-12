'use strict';

var _ = require('lodash');

angular
  .module('main', [
    require('angular-ui-router'),
    require('angular-moment') && 'angularMoment',
    require('angular-sanitize'),
    require('angular-busy') && 'cgBusy',
    require('angular-ui-notification'),
    // modules
    require('./modules/st2-action-reporter').name,
    require('./modules/st2-api').name,
    require('./modules/st2-auto-form').name,
    require('./modules/st2-criteria').name,
    require('./modules/st2-filter').name,
    require('./modules/st2-flex-table').name,
    require('./modules/st2-flow').name,
    require('./modules/st2-highlight').name,
    require('./modules/st2-history-child').name,
    require('./modules/st2-label').name,
    require('./modules/st2-menu').name,
    require('./modules/st2-proportional').name,
    require('./modules/st2-remote-form').name,
    require('./modules/st2-report').name,
    require('./modules/st2-scroll-into-view').name,
    require('./modules/st2-select-on-click').name,
    require('./modules/st2-value-format').name,
    require('./modules/st2-view').name,

    require('./apps/st2-actions').name,
    require('./apps/st2-history').name,
    require('./apps/st2-login').name,
    require('./apps/st2-rules').name

  ])
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
  .controller('MainCtrl', function ($rootScope, $state, st2FlexTableService) {

    // TODO: use a transclude or bind on $stateChangeSuccess instead.
    var scrollToTop = function() {
      document.getElementById('st2-panel__scroller').scrollTop = 0;
    };

    $rootScope.state = $state;
    $rootScope._ = _;

    $rootScope.go = function (state, params, opts) {
      if (!_.isString(state)) {
        opts = params;
        params = state;
        state = $rootScope.state.includes('^.list') ? '^.general' : '.';
      }
      return $rootScope.state.go(state, _.assign({}, $rootScope.state.params, params), opts);
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
      $rootScope.state.go('.', { page: $rootScope.page - 1 }).then(scrollToTop);
    };
    $rootScope.nextPage = function () {
      $rootScope.state.go('.', { page: ($rootScope.page || 1) + 1 }).then(scrollToTop);
    };

    // Filtering
    var filters = ['status', 'action', 'trigger_type', 'rule'];

    $rootScope.updateFiltersAndGo = function (type, activeFilters) {
      var params = _.clone($rootScope.state.params);
      params.page = void 0;
      params[type] = activeFilters.concat();
      $rootScope.state.go('.', params);
    };

    $rootScope.$watchCollection('state.params', function (params) {
      $rootScope.active_filters = _.pick(params, filters);
    });

    // References
    $rootScope.getRef = function (entity) {
      return entity && [entity.pack, entity.name].join('.');
    };

    $rootScope.toggleFlexTables = st2FlexTableService.toggleType.bind(st2FlexTableService);
    $rootScope.areFlexTablesCollapsed = st2FlexTableService.isTypeCollapsed.bind(st2FlexTableService);
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

angular.module('main')
  .filter('yaml', function () {
    var YAML = require('yamljs');

    return function (input) {
      if (typeof input !== 'undefined') {
        return '---\n' + YAML.stringify(input, Infinity, 2);
      }
    };
  });
