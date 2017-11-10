'use strict';

var mod = module.exports = angular.module('main.modules.st2AutoForm.st2FormTextField', []);

var directive = require('./form-text-field.directive.js');

mod
  .directive(directive.name, directive)
;
