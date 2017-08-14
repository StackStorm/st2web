'use strict';

var mod = module.exports = angular.module('main.modules.st2Time', []);

var directive = require('./time.directive.js');

mod
  .directive(directive.name, directive)
  ;
