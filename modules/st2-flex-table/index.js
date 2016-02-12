'use strict';

var directive = require('./flex-table.directive.js');
var service = require('./flex-table.service.js');

module.exports = angular.module('main.modules.st2FlexTable', [])
  .directive(directive.name, directive)
  .service(service.name, service)
  ;
