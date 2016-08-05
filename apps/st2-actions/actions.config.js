'use strict';

var template = require('./template.html');

module.exports = function st2ActionsConfig($stateProvider) {
  $stateProvider
    .state('actions', {
      abstract: true,
      url: '/actions',
      icon: 'icon-play',
      controller: 'st2ActionsCtrl',
      templateUrl: template,
      title: 'Actions',
      position: 2
    })
    .state('actions.list', {
      url: ''
    })
    .state('actions.general', {
      url: '/{ref:[\\w.-]+}/general'
    })
    .state('actions.code', {
      url: '/{ref:[\\w.-]+}/code'
    })

    ;

};
