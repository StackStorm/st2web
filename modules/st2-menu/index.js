'use strict';

var directive = require('./menu.directive.js');

module.exports = angular.module('main.modules.st2Menu', [])
  .directive(directive.name, directive)
  ;
