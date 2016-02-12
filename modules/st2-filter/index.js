'use strict';

var directive = require('./filter.directive.js');

module.exports = angular.module('main.modules.st2Filter', [])
  .directive(directive.name, directive)
  ;
