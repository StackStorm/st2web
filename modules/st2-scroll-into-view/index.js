'use strict';

var mod = module.exports = angular.module('main.modules.st2ScrollIntoView', []);

var directive = require('./scroll-into-view.directive.js');

mod
  .directive(directive.name, directive)
  ;
