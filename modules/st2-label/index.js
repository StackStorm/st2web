'use strict';

var directive = require('./label.directive.js');

module.exports = angular.module('main.modules.st2Label', [])
  .directive(directive.name, directive)
  ;
