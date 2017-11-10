'use strict';

var mod = module.exports = angular.module('main.modules.st2AutoForm.st2FormSelect', []);

var directive = require('./form-select.directive.js');

mod
  .directive(directive.name, directive)
;
