'use strict';
angular.module('main')
  .directive('st2ActionReporter', function () {
    var reporters = {
      'run-local': 'run-local',
      'run-remote': 'run-remote',
      // 'action-chain': 'action-chain',
      // 'workflow': 'action-chain',
      // 'mistral-v1': 'action-chain',
      // 'mistral-v2': 'action-chain',
      'run-local-script': 'run-local',
      'run-remote-script': 'run-remote',
      'run-python': 'run-python'
      // 'http-runner': 'http'
    };

    var linker = function (scope) {
      // Partial router
      scope.getReporter = function (runner) {
        var template = '/modules/st2-action-reporter/reporters/{{ name }}.html';

        return template.split('{{ name }}').join(reporters[runner] || 'debug');
      };

      scope.getTraceback = function (result) {
        return [result.error, result.traceback].join('\n');
      };

    };

    return {
      restrict: 'C',
      scope: {
        'runner': '=',
        'execution': '='
      },
      // TODO: Replace with $templateRequest rountine after switching to Angular 1.3
      template: '<div ng-include="getReporter(runner)"></div>',
      link: linker
    };

  })

  ;
