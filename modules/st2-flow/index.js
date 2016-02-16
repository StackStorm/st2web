'use strict';

var mod = module.exports = angular.module('main.modules.st2Flow', []);

var directive = require('./flow.directive.js');

mod
  .directive(directive.name, directive)
  ;
