'use strict';

var template = require('./template.html');

module.exports =
  function st2HistoryChild(st2api) {

    return {
      restrict: 'C',
      scope: {
        'workflow': '=',
        'view': '='
      },
      template: '<div ng-include="\'' + template + '\'"></div>',
      link: function postLink(scope) {
        scope.getTaskName = function (record) {
          return {
            'action-chain': function () {
              var context = record.context.chain;
              return context && context.name;
            },
            'mistral-v2': function () {
              var context = record.context.mistral;
              return context && context.task_name;
            }
          }[scope.workflow.action.runner_type]();
        };

        scope.expand = function (record, $event) {
          $event.stopPropagation();

          record._expanded = !record._expanded;

          if (record._expanded) {
            st2api.client.executions.list({
              parent: record.id,
              exclude_attributes: 'result,trigger_instance'
            }).then(function (records) {
              record._children = records;
              this.$apply();
            }.bind(this));
          }
        };
      }
    };

  };
