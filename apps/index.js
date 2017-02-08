'use strict';

var apps = [
  require('./st2-docs').name,
  require('./st2-actions').name,
  require('./st2-history').name,
  require('./st2-login').name,
  require('./st2-rules').name
];
var extensions = require('./extensions');

module.exports = angular.module('main.apps', apps.concat(extensions));
