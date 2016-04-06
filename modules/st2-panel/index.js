'use strict';

var mod = module.exports = angular.module('main.modules.st2Panel', [
  require('angular-busy') && 'cgBusy'
]);

var value = require('./panel.value.js');

mod
  .value(value.name, value)
  ;
