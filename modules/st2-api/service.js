/*global st2client:true*/
// ^^ we should not use st2api global variable anywhere else outside the module
'use strict';

angular.module('main')
  .service('st2api', function () {
    var parser = document.createElement('a');
    parser.href = localStorage.getItem('st2Host');

    return st2client({
      protocol: parser.protocol.split(':')[0],
      host: parser.hostname,
      port: parser.port
    });
  });
