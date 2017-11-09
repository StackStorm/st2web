'use strict';
angular.module('main')
  .constant('st2Config', {

    hosts: [{
      name: 'Dev Env',
      url: 'https://192.168.16.20/api',
      auth: 'https://192.168.16.20/auth'
    }]

  });
