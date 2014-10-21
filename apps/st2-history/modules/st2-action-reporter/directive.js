'use strict';
angular.module('main')
  .directive('st2ActionReporter', function () {
    var reporters = {
      'run-local': '/apps/st2-history/modules/st2-action-reporter/reporters/run-local.html',
      'run-remote': '/apps/st2-history/modules/st2-action-reporter/reporters/run-local.html',
      'action-chain': '/apps/st2-history/modules/st2-action-reporter/reporters/action-chain.html',
      'workflow': '/apps/st2-history/modules/st2-action-reporter/reporters/action-chain.html',
      'mistral-v1': '/apps/st2-history/modules/st2-action-reporter/reporters/action-chain.html',
      'mistral-v2': '/apps/st2-history/modules/st2-action-reporter/reporters/action-chain.html',
      'run-local-script': '/apps/st2-history/modules/st2-action-reporter/reporters/run-local.html',
      'http-runner': '/apps/st2-history/modules/st2-action-reporter/reporters/http.html'
    };

    var linker = function (scope) {
      // Partial router
      scope.getReporter = function (runner) {
        return reporters[runner];
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
