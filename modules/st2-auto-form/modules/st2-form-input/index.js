'use strict';

var directive = require('./form-input.directive.js');

module.exports = angular.module('main.modules.st2AutoForm.st2FormInput', [])
  .directive(directive.name, directive)
  ;
