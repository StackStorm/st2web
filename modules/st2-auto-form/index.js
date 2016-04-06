'use strict';

var mod = module.exports = angular.module('main.modules.st2AutoForm', [
  require('./modules/st2-form-array').name,
  require('./modules/st2-form-checkbox').name,
  require('./modules/st2-form-combobox').name,
  require('./modules/st2-form-input').name,
  require('./modules/st2-form-object').name,
  require('./modules/st2-form-select').name,
  require('./modules/st2-form-text').name,
  require('./modules/st2-form-text-field').name
]);

var directive = require('./auto-form.directive.js');

mod
  .directive(directive.name, directive)
  ;
