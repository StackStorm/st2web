'use strict';

var mod = module.exports = angular.module('main.modules.st2AutoForm.st2FormObject', []);

var directive = require('./form-object.directive.js');

mod
  .directive(directive.name, directive)
;
