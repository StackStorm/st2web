'use strict';

var directive = require('./highlight.directive.js');

module.exports = angular.module('main.modules.st2Highlight', [])
  .directive(directive.name, directive)
  ;
