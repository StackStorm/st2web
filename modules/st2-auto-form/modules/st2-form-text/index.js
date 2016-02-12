'use strict';

var directive = require('./form-text.directive.js');

module.exports = angular.module('main.modules.st2AutoForm.st2FormText', [])
  .directive(directive.name, directive)
  ;
