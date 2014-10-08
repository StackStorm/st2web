'use strict';

angular.module('main')
  .service('st2Api', function($resource, $rootScope, $http) {
    var storedHost = localStorage.getItem('st2Host');

    var HOST = storedHost || '//172.168.50.50:9101';

    var scope = $rootScope.$new();

    function buildResource (params, actions) {
      return $resource(HOST + '/:resource/:id', params, _.defaults({}, {
        list: {
          method: 'GET',
          isArray: true
        },
        create: {
          method: 'POST'
        },
        get: {
          method: 'GET'
        },
        update: {
          method: 'PUT'
        },
        remove: {
          method: 'DELETE'
        }
      }, actions));
    }

    scope.rules = buildResource({ resource: 'rules' });
    // scope.actions = buildResource({ resource: 'actions' });
    // scope.runnertypes = buildResource({ resource: 'runnertypes' });
    scope.triggers = buildResource({ resource: 'triggers' });
    scope.triggerInstances = buildResource({ resource: 'triggerinstances' });
    // scope.actionExecutions = buildResource({ resource: 'actionexecutions' });
    // scope.history = buildResource({ resource: 'history' });

    var Client = function (url) {
      var promise
        , list
        , scope = $rootScope.$new(true);

      scope.fetch = function (page, params) {
        var limit = 20;

        page = page > 1 ? parseInt(page) : 1;

        promise = $http.get(HOST + url, {
          params: _.defaults({
            limit: limit,
            offset: (page - 1) * limit
          }, params)
        });

        promise.then(function () {
          list = promise.then(function (response) {
            return response.data;
          });
        });

        return promise;
      };

      scope.fetchOne = function (id) {
        return $http.get(HOST + url + '/' + id);
      };

      scope.get = function (id) {
        var action;

        if (promise) {
          action = promise.then(function (promise) {
            if (id) {
              var cached = _.find(promise.data, function (action) {
                return action.id === id;
              });

              return cached || scope.fetchOne(id).then(function (response) {
                return response.data;
              });
            } else {
              return _.first(promise.data);
            }
          });
        }

        return action;
      };

      scope.list = function () {
        return list;
      };

      scope.find = function (params) {
        var localPromise;

        localPromise = $http.get(HOST + url, { params: params })
          .then(function (response) {
            return response.data;
          });

        return localPromise;
      };

      scope.create = function (body) {
        var localPromise;

        localPromise = $http.post(HOST + url, body)
          .then(function (response) {
            return response.data;
          });

        return localPromise;
      };

      return scope;
    };

    scope.actions = new Client('/actions/views/overview');
    scope.executions = new Client('/actionexecutions');

    scope.history = new Client('/history/executions');

    return scope;

  }).filter('unwrap', function () {
    return function (v) {
      if (v && v.then) {
        var p = v;
        if (!('$$v' in v)) {
          p.$$v = undefined;
          p.then(function(val) { p.$$v = val; });
        }
        v = v.$$v;
      }
      return v;
    };
  }).filter('toEntity', function (st2Api, $filter) {
    return function (input, type) {
      var entity = $filter('unwrap')(st2Api[type]);
      return entity && entity.index[input] || input;
    };
  });
