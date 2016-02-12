'use strict';

var directive = require('./select-on-click.directive.js');

module.exports = angular.module('main.modules.selectOnClick', [])
  .directive(directive.name, directive)
  ;
