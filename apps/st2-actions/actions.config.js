'use strict';

var template = require('./template.html');

module.exports = function st2ActionsConfig($stateProvider) {
  const baseState = {
    title: 'Actions',
  };

  $stateProvider
    .state('actions', Object.assign({}, baseState, {
      abstract: true,
      url: '/actions',
      icon: 'icon-play',
      controller: 'st2ActionsCtrl',
      templateUrl: template,
      position: 2
    }))
    .state('actions.list', Object.assign({}, baseState, {
      url: ''
    }))
    .state('actions.general', Object.assign({}, baseState, {
      url: '/{ref:[\\w.-]+}/general'
    }))
    .state('actions.code', Object.assign({}, baseState, {
      url: '/{ref:[\\w.-]+}/code'
    }))

    ;

};
