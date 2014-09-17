'use strict';

angular.module('main')
  .service('st2Api', function($resource, $rootScope) {
    var HOST = '//172.168.50.50:9101';

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
    scope.actions = buildResource({ resource: 'actions' });
    scope.triggers = buildResource({ resource: 'triggers' });

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
