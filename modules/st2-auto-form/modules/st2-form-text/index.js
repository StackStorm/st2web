'use strict';

var mod = module.exports = angular.module('main.modules.st2AutoForm.st2FormText', []);

var directive = require('./form-text.directive.js');

mod
  .directive(directive.name, directive)
;
