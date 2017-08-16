'use strict';

var mod = module.exports = angular.module('main.apps.st2Rules', [

]);

var controller = require('./rules.controller.js');
var config = require('./rules.config.js');
var run = require('./rules.run.js');
var directive = require('./rules.directive.js');

mod
  .config(config)
  .controller(controller.name, controller)
  .directive(directive.name, directive)
  .run(run)
  ;
