'use strict';

var mod = module.exports = angular.module('main.modules.st2AutoForm.st2FormInput', []);

var directive = require('./form-input.directive.js');

mod
  .directive(directive.name, directive)
  ;
