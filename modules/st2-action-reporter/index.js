'use strict';

var mod = module.exports = angular.module('main.modules.st2ActionReporter', []);

var directive = require('./action-reporter.directive.js');

mod
  .directive(directive.name, directive)
  ;
