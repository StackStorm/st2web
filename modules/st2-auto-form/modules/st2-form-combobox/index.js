'use strict';

var directive = require('./form-combobox.directive.js');
var suggestions = require('./suggestions.directive.js');

module.exports = angular.module('main.modules.st2AutoForm.st2FormCombobox', [])
  .directive(directive.name, directive)
  .directive(suggestions.name, suggestions)
  ;
