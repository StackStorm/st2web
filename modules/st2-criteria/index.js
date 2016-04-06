'use strict';

var mod = module.exports = angular.module('main.modules.st2Criteria', []);

var directive = require('./criteria.directive.js');

mod
  .directive(directive.name, directive)
  ;
