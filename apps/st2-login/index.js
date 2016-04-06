'use strict';

var mod = module.exports = angular.module('main.apps.st2Login', [

]);

var controller = require('./login.controller.js');
var config = require('./login.config.js');
var run = require('./login.run.js');

mod
  .config(config)
  .controller(controller.name, controller)
  .run(run)
  ;
