'use strict';

var directive = require('./form-array.directive.js');

module.exports = angular.module('main.modules.st2AutoForm.st2FormArray', [])
  .directive(directive.name, directive)
  ;
