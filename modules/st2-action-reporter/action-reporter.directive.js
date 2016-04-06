'use strict';

var reporters = require('./reporters');

module.exports =
  function st2ActionReporter() {
    var linker = function (scope) {
      // Partial router
      scope.getReporter = function (runner) {
        return reporters[runner] || reporters['debug'];
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

  };
