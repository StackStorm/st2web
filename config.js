'use strict';
angular.module('main')
  .constant('st2Config', {

    hosts: [{
      name: 'Dev Env',
      url: '//172.168.50.50:9101'
    }, {
      name: 'Stage 1',
      url: '//st2stage001.stackstorm.net:9101'
    }, {
      name: 'Stage 2',
      url: '//st2stage002.stackstorm.net:9101'
    }, {
      name: 'Stage 3',
      url: '//st2stage003.stackstorm.net:9101'
    }]

  });
