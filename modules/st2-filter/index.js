'use strict';

var mod = module.exports = angular.module('main.modules.st2Filter', []);

var directive = require('./filter.directive.js');

mod
  .directive(directive.name, directive)
;
