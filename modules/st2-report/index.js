'use strict';

var mod = module.exports = angular.module('main.modules.st2Report', []);

var directive = require('./report.directive.js');

mod
  .directive(directive.name, directive)
  ;
