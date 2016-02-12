'use strict';

var directive = require('./history-child.directive.js');

module.exports = angular.module('main.modules.st2HistoryChild', [])
  .directive(directive.name, directive)
  ;
