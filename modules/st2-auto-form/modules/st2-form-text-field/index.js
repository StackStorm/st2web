'use strict';

var directive = require('./form-text-field.directive.js');

module.exports = angular.module('main.modules.st2AutoForm.st2FormTextField', [])
  .directive(directive.name, directive)
  ;
