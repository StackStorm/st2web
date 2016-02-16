'use strict';

var template = require('./template.html');

module.exports = function st2LoginConfig($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('login', {
      controller: 'st2LoginCtrl',
      templateUrl: template
    })
    ;

  $urlRouterProvider.deferIntercept();

};
