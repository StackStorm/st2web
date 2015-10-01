'use strict';
angular.module('main')
  .constant('st2Config', {

    hosts: [
      {
        name: '001',
        url: 'http://st2build001:9101'
      }, 
      {
        name: 'Staging',
        url: 'http://st2stage201:9101',
        auth: 'http://st2stage201:9100',
        flow: 'http://127.0.0.1:4000'
      },
      {
        name: 'Express',
        url: 'http://172.168.50.11:9101',
        flow: 'http://127.0.0.1:4000'
      }
    ]
  });
