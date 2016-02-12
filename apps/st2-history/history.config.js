'use strict';

module.exports = function st2HistoryConfig($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/history');

  $stateProvider
    .state('history', {
      abstract: true,
      url: '/history',
      icon: 'st2-icon__history',
      controller: 'st2HistoryCtrl',
      templateUrl: 'apps/st2-history/template.html',
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
