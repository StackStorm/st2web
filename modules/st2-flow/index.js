'use strict';

var directive = require('./flow.directive.js');

module.exports = angular.module('main.modules.st2Flow', [])
  .directive(directive.name, directive)
  ;
