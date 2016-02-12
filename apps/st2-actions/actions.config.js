'use strict';

module.exports = function st2ActionsConfig($stateProvider) {
  $stateProvider
    .state('actions', {
      abstract: true,
      url: '/actions',
      icon: 'st2-icon__actions',
      controller: 'st2ActionsCtrl',
      templateUrl: 'apps/st2-actions/template.html',
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
