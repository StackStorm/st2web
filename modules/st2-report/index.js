'use strict';

var directive = require('./report.directive.js');

module.exports = angular.module('main.modules.st2Report', [])
  .directive(directive.name, directive)
  ;
