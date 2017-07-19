'use strict';

var template = require('./template.html');

module.exports = function st2PacksConfig($stateProvider) {
  const baseState = {
    title: 'Packs'
  };

  $stateProvider
    .state('packs', Object.assign({}, baseState, {
      abstract: true,
      url: '/packs',
      icon: 'icon-platforms',
      controller: 'st2PacksCtrl',
      templateUrl: template,
      position: 4
    }))
    .state('packs.list', Object.assign({}, baseState, {
      url: ''
    }))
    .state('packs.general', Object.assign({}, baseState, {
      url: '/{ref:[\\w.-]+}/general'
    }))

    ;

};
