'use strict';
angular.module('main')

  // Docs controller
  .controller('st2DocsCtrl', function ($scope, st2Api) {
    $scope.rules = st2Api.rules.list();
    $scope.ruleFields = ['id', 'name', 'description', 'trigger.type', 'trigger.parameters', 'criteria', 'action.name', 'action.parameters'];
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
