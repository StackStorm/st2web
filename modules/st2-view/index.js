'use strict';

var directive = require('./view.directive.js');

module.exports = angular.module('main.modules.st2View', [])
  .directive(directive.name, directive)
  ;
