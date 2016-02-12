'use strict';

var directive = require('./form-select.directive.js');

module.exports = angular.module('main.modules.st2AutoForm.st2FormSelect', [])
  .directive(directive.name, directive)
  ;
