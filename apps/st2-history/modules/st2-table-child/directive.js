'use strict';

angular.module('main')
  .directive('st2TableChild', function () {

    return {
      restrict: 'C',
      scope: {
        'children': '='
      },
      templateUrl: 'apps/st2-history/modules/st2-table-child/template.html',
      link: function postLink() {}
    };

  });
