'use strict';

angular.module('main')
  .directive('st2Criteria', function () {

    return {
      restrict: 'C',
      scope: {
        model: '=',
        disabled: '='
      },
      templateUrl: 'modules/st2-criteria/template.html',
      link: function postLink(scope) {
        scope.remove = function (key) {
          delete scope.model[key];
        };

        scope.add = function () {
          scope.model[''] = {};
        };
      }
    };

  })
  .controller('st2CriterionCtrl', function ($scope) {

    $scope.$watch('key', function (key, oldKey) {
      if (key !== oldKey) {
        $scope.$parent.model[key] = $scope.$parent.model[oldKey];
        delete $scope.$parent.model[oldKey];
      }
    });

  });
