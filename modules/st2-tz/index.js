'use strict';

var mod = module.exports = angular.module('main.modules.st2Tz', []);

var directive = require('./menu.directive.js');

mod
  .directive(directive.name, directive)
  ;
