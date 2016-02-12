'use strict';

var controller = require('./actions.controller.js');
var config = require('./actions.config.js');

module.exports = angular
  .module('main.apps.st2Actions', [

  ])
  .config(config)
  .controller(controller.name, controller)
  ;
