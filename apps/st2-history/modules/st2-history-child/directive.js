'use strict';

angular.module('main')
  .directive('st2HistoryChild', function (st2api) {

    return {
      restrict: 'C',
      scope: {
        'children': '='
      },
      templateUrl: 'apps/st2-history/modules/st2-history-child/template.html',
      link: function postLink(scope) {
        scope.view = scope.$parent.view;

        // scope.expand = function (record, $event) {
        //   $event.stopPropagation();
        //
        //   record._expanded = !record._expanded;
        //
        //   if (record._expanded) {
        //     st2api.history.list({
        //       'parent': record.id
        //     }).then(function (records) {
        //       record._children = records;
        //       console.log(records);
        //       this.$apply();
        //     }.bind(this));
        //   }
        // };
      }
    };

  });
