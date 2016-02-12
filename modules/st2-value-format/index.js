'use strict';

var directive = require('./value-format.directive.js');

module.exports = angular.module('main.modules.st2ValueFormat', [])
  .directive(directive.name, directive)
  ;
