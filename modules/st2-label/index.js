'use strict';

var mod = module.exports = angular.module('main.modules.st2Label', []);

var directive = require('./label.directive.js');

mod
  .directive(directive.name, directive)
  ;
