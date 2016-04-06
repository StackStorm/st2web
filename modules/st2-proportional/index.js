'use strict';

var mod = module.exports = angular.module('main.modules.st2Proportional', []);

var directive = require('./proportional.directive.js');

mod
  .directive(directive.name, directive)
  ;
