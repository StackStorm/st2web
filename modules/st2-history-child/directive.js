'use strict';

angular.module('main')
  .directive('st2HistoryChild', function (st2api) {

    return {
      restrict: 'C',
      scope: {
        'workflow': '=',
        'view': '='
      },
      template: '<div ng-include="\'modules/st2-history-child/template.html\'"></div>',
      link: function postLink(scope) {
        scope.getTaskName = function (record) {
          return {
            'action-chain': function () {
              var context = record.liveaction.context.chain;
              return context && context.name;
            },
            'mistral-v2': function () {
              var context = record.liveaction.context.mistral;
              return context && context.task_name;
            }
          }[scope.workflow.action.runner_type]();
        };

        scope.expand = scope.$parent.expand;

      }
    };

  });
