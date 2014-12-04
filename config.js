'use strict';
angular.module('main')
  .constant('st2Config', {

    hosts: [{
      name: 'Dev Env',
      url: '//172.168.50.50:9101'
    }, {
      name: 'Express',
      url: '//172.168.90.50:9101'
    }, {
      name: 'CI/CD Pipeline Dev',
      url: '//api.st2.service.consul:9101'
    }]

  });
