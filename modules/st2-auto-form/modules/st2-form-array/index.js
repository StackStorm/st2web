'use strict';

var mod = module.exports = angular.module('main.modules.st2AutoForm.st2FormArray', []);

var directive = require('./form-array.directive.js');

mod
  .directive(directive.name, directive)
  ;
