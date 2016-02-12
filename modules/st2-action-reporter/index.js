'use strict';

var directive = require('./action-reporter.directive.js');

module.exports = angular.module('main.modules.st2ActionReporter', [])
  .directive(directive.name, directive)
  ;
