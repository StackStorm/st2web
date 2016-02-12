'use strict';

var directive = require('./proportional.directive.js');

module.exports = angular.module('main.modules.st2Proportional', [])
  .directive(directive.name, directive)
  ;
