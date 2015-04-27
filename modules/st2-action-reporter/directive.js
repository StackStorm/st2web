'use strict';
angular.module('main')
  .directive('st2ActionReporter', function () {
    var reporters = {
      'local-shell-cmd': 'run-local',
      'remote-shell-cmd': 'run-remote',
      // 'action-chain': 'action-chain',
      // 'workflow': 'action-chain',
      // 'mistral-v1': 'action-chain',
      // 'mistral-v2': 'action-chain',
      'local-shell-script': 'run-local',
      'remote-shell-script': 'run-remote',
      'python-shell': 'run-python'
      // 'http-runner': 'http'
    };

    var linker = function (scope) {
      // Partial router
      scope.getReporter = function (runner) {
        var template = 'modules/st2-action-reporter/reporters/{{ name }}.html';

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
