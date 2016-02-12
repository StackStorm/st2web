'use strict';

module.exports = function st2LoginConfig($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('login', {
      controller: 'st2LoginCtrl',
      templateUrl: 'apps/st2-login/template.html'
    })
    ;

  $urlRouterProvider.deferIntercept();

};
