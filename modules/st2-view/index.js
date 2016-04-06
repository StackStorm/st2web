'use strict';

var mod = module.exports = angular.module('main.modules.st2View', []);

var directive = require('./view.directive.js');

mod
  .directive(directive.name, directive)
  ;
