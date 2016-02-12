'use strict';

var directive = require('./remote-form.directive.js');

module.exports = angular.module('main.modules.st2RemoteForm', [])
  .directive(directive.name, directive)
  ;
