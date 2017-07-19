'use strict';

module.exports = angular.module('main.apps', [
  require('./st2-docs').name,
  require('./st2-actions').name,
  require('./st2-history').name,
  require('./st2-login').name,
  require('./st2-rules').name,
  require('./st2-packs').name
]);
