'use strict';

var mod = module.exports = angular.module('main.modules.st2RemoteForm', []);

var directive = require('./remote-form.directive.js');

mod
  .directive(directive.name, directive)
  ;
