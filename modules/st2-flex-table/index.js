'use strict';

var mod = module.exports = angular.module('main.modules.st2FlexTable', []);

var directive = require('./flex-table.directive.js');
var service = require('./flex-table.service.js');

mod
  .directive(directive.name, directive)
  .service(service.name, service)
  ;
