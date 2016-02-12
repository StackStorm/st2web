'use strict';

var directive = require('./criteria.directive.js');

module.exports = angular.module('main.modules.st2Criteria', [])
  .directive(directive.name, directive)
  ;
