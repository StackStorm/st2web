'use strict';

var config = require('./notification.config.js');

module.exports = angular.module('main.modules.st2Notification', [])
  .config(config)
  ;
