'use strict';

var controller = require('./history.controller.js');
var config = require('./history.config.js');
var fmtParam = require('./fmt-param.filter.js');
var isExpandable = require('./is-expandable.filter.js');

module.exports = angular
  .module('main.apps.st2History', [

  ])
  .config(config)
  .controller(controller.name, controller)
  .filter(fmtParam.name, fmtParam)
  .filter(isExpandable.name, isExpandable)
  ;
