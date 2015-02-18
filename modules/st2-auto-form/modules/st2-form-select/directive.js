'use strict';
angular.module('main')
  .directive('st2FormSelect', function () {
    return {
      restrict: 'C',
      scope: {
        'name': '=',
        'spec': '=',
        'result': '=',
        'disabled': '='
      },
      templateUrl: 'modules/st2-auto-form/modules/st2-form-select/template.html'
    };

  })

  ;
