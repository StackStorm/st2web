'use strict';
angular.module('main')
  .directive('st2FormInput', function () {
    return {
      restrict: 'C',
      scope: {
        'name': '=',
        'spec': '=',
        'result': '='
      },
      templateUrl: 'modules/st2-auto-form/modules/st2-form-input/template.html'
    };

  })

  ;
