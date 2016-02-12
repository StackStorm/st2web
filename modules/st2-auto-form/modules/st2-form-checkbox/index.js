'use strict';

var directive = require('./form-checkbox.directive.js');

module.exports = angular.module('main.modules.st2AutoForm.st2FormCheckbox', [])
  .directive(directive.name, directive)
  ;
