'use strict';

var directive = require('./form-object.directive.js');

module.exports = angular.module('main.modules.st2AutoForm.st2FormObject', [])
  .directive(directive.name, directive)
  ;
