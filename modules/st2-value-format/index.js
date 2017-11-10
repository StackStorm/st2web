'use strict';

var mod = module.exports = angular.module('main.modules.st2ValueFormat', []);

var directive = require('./value-format.directive.js');

mod
  .directive(directive.name, directive)
;
