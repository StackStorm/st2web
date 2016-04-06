'use strict';

var mod = module.exports = angular.module('main.modules.st2FilterExpandable', [

]);

var filter = require('./is-expandable.filter.js');

mod
  .filter(filter.name, filter)
  ;
