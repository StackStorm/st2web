'use strict';

var mod = module.exports = angular.module('main.apps.st2Packs', [

]);

var controller = require('./packs.controller.js');
var config = require('./packs.config.js');
var directive = require('./packs.directive.js');

mod
  .config(config)
  .controller(controller.name, controller)
  .directive(directive.name, directive)
  ;
