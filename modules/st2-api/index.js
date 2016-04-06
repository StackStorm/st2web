'use strict';

var mod = module.exports = angular.module('main.modules.st2api', []);

var service = require('./api.service.js');

mod
  .service(service.name, service)
  ;
