'use strict';

angular.module('main')
  .directive('st2Criteria', function () {

    return {
      restrict: 'C',
      require: 'ngModel',
      scope: {
        ngModel: '=',
        disabled: '='
      },
      templateUrl: 'modules/st2-criteria/template.html',
      link: function postLink(scope) {
        scope.ngModel = scope.ngModel || {};

        scope.remove = function (key) {
          delete scope.ngModel[key];
        };

        scope.add = function () {
          scope.ngModel[''] = {};
        };
      }
    };

  })
  .controller('st2CriterionCtrl', function ($scope) {

    $scope.$watch('key', function (key, oldKey) {
      if (key !== oldKey) {
        $scope.$parent.ngModel[key] = $scope.$parent.ngModel[oldKey];
        delete $scope.$parent.ngModel[oldKey];
      }
    });

  });
