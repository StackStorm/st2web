'use strict';

var controller = require('./login.controller.js');
var config = require('./login.config.js');
var run = require('./login.run.js');

module.exports = angular
  .module('main.apps.st2Login', [

  ])
  .config(config)
  .controller(controller.name, controller)
  .run(run)
  ;
