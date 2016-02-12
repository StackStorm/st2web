'use strict';

var service = require('./api.service.js');

module.exports = angular.module('main.modules.st2api', [])
  .service(service.name, service)
  ;
