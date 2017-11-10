'use strict';

var mod = module.exports = angular.module('main.modules.st2AutoForm.st2FormCheckbox', []);

var directive = require('./form-checkbox.directive.js');

mod
  .directive(directive.name, directive)
;
