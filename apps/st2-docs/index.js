'use strict';

var mod = module.exports = angular.module('main.apps.st2Docs', [

]);

mod
  .config(function ($stateProvider) {

    $stateProvider
      .state('docs', {
        abstract: true,
        title: 'Docs',
        icon: 'icon-book-open',
        position: 5,
        href: 'https://docs.stackstorm.com/',
        target: 'st2-docs'
      })
      ;

  })
  ;
