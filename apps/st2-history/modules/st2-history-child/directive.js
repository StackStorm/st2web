'use strict';

angular.module('main')
  .directive('st2HistoryChild', function () {

    return {
      restrict: 'C',
      scope: {
        'children': '='
      },
      templateUrl: 'apps/st2-history/modules/st2-history-child/template.html',
      link: function postLink() {}
    };

  });
