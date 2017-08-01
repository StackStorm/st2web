'use strict';

var mod = module.exports = angular.module('main.modules.st2Redux', []);

var directive = require('./redux.directive.js');

mod
  .directive(directive.name, directive)
  ;
