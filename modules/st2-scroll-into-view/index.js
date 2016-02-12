'use strict';

var directive = require('./scroll-into-view.directive.js');

module.exports = angular.module('main.modules.st2ScrollIntoView', [])
  .directive(directive.name, directive)
  ;
