'use strict';

var mod = module.exports = angular.module('main.modules.st2Highlight', []);

var directive = require('./highlight.directive.js');

mod
  .directive(directive.name, directive)
  ;
