'use strict';

var template = require('./template.html');

module.exports = function st2HistoryConfig($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/history');

  const baseState = {
    title: 'History'
  };

  $stateProvider
    .state('history', Object.assign({}, baseState, {
      abstract: true,
      url: '/history',
      icon: 'icon-history',
      controller: 'st2HistoryCtrl',
      templateUrl: template,
      position: 1
    }))
    .state('history.list', Object.assign({}, baseState, {
      url: '?page&status&action&rule&trigger&trigger_type'
    }))
    .state('history.general', Object.assign({}, baseState, {
      url: '/{id:\\w+}/general?page&status&action&rule&trigger&trigger_type'
    }))
    .state('history.code', Object.assign({}, baseState, {
      url: '/{id:\\w+}/code?page&status&action&rule&trigger&trigger_type'
    }))
    .state('history.rerun', Object.assign({}, baseState, {
      url: '/{id:\\w+}/rerun?page&status&action&rule&trigger&trigger_type'
    }))

    ;

};
