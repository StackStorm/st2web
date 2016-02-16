'use strict';

module.exports = angular.module('main.dependencies', [
  require('angular-ui-router'),
  require('angular-moment') && 'angularMoment',
  require('angular-sanitize'),
  require('angular-ui-notification')
]);
