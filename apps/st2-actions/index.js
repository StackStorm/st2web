'use strict';

var mod = module.exports = angular.module('main.apps.st2Actions', [

]);

var controller = require('./actions.controller.js');
var config = require('./actions.config.js');

mod
  .config(config)
  .controller(controller.name, controller)
  ;
