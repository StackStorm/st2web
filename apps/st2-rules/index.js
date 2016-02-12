'use strict';

var controller = require('./rules.controller.js');
var config = require('./rules.config.js');
var run = require('./rules.run.js');

module.exports = angular
  .module('main.apps.st2Rules', [

  ])
  .config(config)
  .controller(controller.name, controller)
  .run(run)
  ;
