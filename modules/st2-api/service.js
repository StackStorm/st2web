/*global st2client:true*/
// ^^ we should not use st2api global variable anywhere else outside the module
'use strict';

angular.module('main')
  .service('st2api', function (st2Config) {
    var url = localStorage.getItem('st2Host');

    var parser = document.createElement('a');
    parser.href = _.find(st2Config.hosts, {url: url}) && url || _.first(st2Config.hosts).url;

    return st2client({
      protocol: parser.protocol.split(':')[0],
      host: parser.hostname,
      port: parser.port
    });
  });
