'use strict';

var mod = module.exports = angular.module('main.modules.selectOnClick', []);

var directive = require('./select-on-click.directive.js');

mod
  .directive(directive.name, directive)
;
