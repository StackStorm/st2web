'use strict';

var template = require('./template.html');

module.exports = function st2RulesConfig($stateProvider) {

  $stateProvider
    .state('rules', {
      abstract: true,
      url: '/rules',
      icon: 'icon-book-closed',
      controller: 'st2RulesCtrl',
      templateUrl: template,
      title: 'Rules',
      position: 3
    })
    .state('rules.list', {
      url: ''
    })
    .state('rules.new', {
      url: '/new'
    })
    .state('rules.general', {
      url: '/{ref:[\\w.-]+}/general?edit'
    })
    .state('rules.code', {
      url: '/{ref:[\\w.-]+}/code?edit'
    })

    ;

};
