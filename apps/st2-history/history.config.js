'use strict';

var template = require('./template.html');

module.exports = function st2HistoryConfig($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/history');

  $stateProvider
    .state('history', {
      abstract: true,
      url: '/history',
      icon: 'icon-history',
      controller: 'st2HistoryCtrl',
      templateUrl: template,
      title: 'History',
      position: 1
    })
    .state('history.list', {
      url: '?page&status&action&rule&trigger&trigger_type'
    })
    .state('history.general', {
      url: '/{id:\\w+}/general?page&status&action&rule&trigger&trigger_type'
    })
    .state('history.code', {
      url: '/{id:\\w+}/code?page&status&action&rule&trigger&trigger_type'
    })
    .state('history.rerun', {
      url: '/{id:\\w+}/rerun?page&status&action&rule&trigger&trigger_type'
    })

    ;

};
