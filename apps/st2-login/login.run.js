'use strict';

module.exports = function st2LoginRun($rootScope, $urlRouter, st2api, $state) {

  $rootScope.$on('$locationChangeSuccess', function(e) {
    if (st2api.isConnected()) {
      return;
    }

    e.preventDefault();

    $state.go('login');
  });

  $urlRouter.listen();

};
