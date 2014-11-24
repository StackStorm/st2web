/*global st2client:true*/
// ^^ we should not use st2api global variable anywhere else outside the module
'use strict';

angular.module('main')
  .service('st2api', function () {
    return st2client();
  });
