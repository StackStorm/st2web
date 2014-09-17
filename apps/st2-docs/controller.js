'use strict';
angular.module('main')

  // Docs controller
  .controller('st2DocsCtrl', function ($scope, st2Api) {
    $scope.rules = st2Api.rules.list();

    $scope.actions = st2Api.actions.list();
    $scope.actions.$promise.then(function (actions) {
      var id = _.first(actions, { name: 'http' })[0].id;
      $scope.action = st2Api.actions.get({ id: id});
    });

    $scope.triggers = st2Api.triggers.list();
  })

  .filter('getProperty', function () {
    return function getPropertyFilter (property, propertyName) {
      var parts = propertyName.split('.')
        , length = parts.length;

      for (var i = 0; i < length; i++) {
        property = property[parts[i]];
      }

      return property;
    };
  });
