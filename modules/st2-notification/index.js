'use strict';

var mod = module.exports = angular.module('main.modules.st2Notification', []);

var config = require('./notification.config.js');

mod
  .config(config)
;
