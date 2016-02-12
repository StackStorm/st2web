'use strict';

module.exports = function st2RulesRun($rootScope, $urlRouter) {

  $rootScope.$on('$stateChangeStart',
    function(event, toState, toParams, fromState, fromParams) {
      if (fromParams.edit && fromParams.edit !== toParams.edit) {
        var answer = window.confirm('Are you sure you want to cancel editing the rule? All changes would be lost.');

        if (!answer) {
          event.preventDefault();
        }
      }
    });

  $urlRouter.listen();

};
