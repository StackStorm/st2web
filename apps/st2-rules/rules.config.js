'use strict';

var template = require('./template.html');

module.exports = function st2RulesConfig($stateProvider) {
  const baseState = {
    title: 'Rules',
  };

  $stateProvider
    .state('rules', Object.assign({}, baseState, {
      abstract: true,
      url: '/rules',
      icon: 'icon-book-closed',
      controller: 'st2RulesCtrl',
      templateUrl: template,
      position: 3
    }))
    .state('rules.list', Object.assign({}, baseState, {
      url: ''
    }))
    .state('rules.new', Object.assign({}, baseState, {
      url: '/new'
    }))
    .state('rules.general', Object.assign({}, baseState, {
      url: '/{ref:[\\w.-]+}/general?edit'
    }))
    .state('rules.code', Object.assign({}, baseState, {
      url: '/{ref:[\\w.-]+}/code?edit'
    }))

    ;

};
