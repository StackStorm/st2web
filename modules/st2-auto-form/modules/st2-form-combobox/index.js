'use strict';

var mod = module.exports = angular.module('main.modules.st2AutoForm.st2FormCombobox', []);

var directive = require('./form-combobox.directive.js');
var suggestions = require('./suggestions.directive.js');

mod
  .directive(directive.name, directive)
  .directive(suggestions.name, suggestions)
  ;
