'use strict';

var mod = module.exports = angular.module('main.modules.st2HistoryChild', []);

var directive = require('./history-child.directive.js');

mod
  .directive(directive.name, directive)
  ;
