'use strict';

var mod = module.exports = angular.module('main.apps.st2History', [

]);

var controller = require('./history.controller.js');
var config = require('./history.config.js');
var fmtParam = require('./fmt-param.filter.js');
var rerun = require('./rerun.directive.js');

mod
  .config(config)
  .directive(rerun.name, rerun)
  .controller(controller.name, controller)
  .filter(fmtParam.name, fmtParam)
  ;
