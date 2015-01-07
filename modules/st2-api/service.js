/*global st2client:true*/
// ^^ we should not use st2api global variable anywhere else outside the module
'use strict';

angular.module('main')
  .service('st2api', function (st2Config, $q) {
    this.token = {};

    var initClient = function (url, token) {
      var parser = document.createElement('a');
      parser.href = _.find(st2Config.hosts, {url: url}) && url || _.first(st2Config.hosts).url;

      return st2client({
        protocol: parser.protocol.split(':')[0],
        host: parser.hostname,
        port: parser.port,
        token: token
      });
    };

    this.connect = function (url, user, password, remember) {

      this.client = initClient(url, this.token);

      if (user && password) {
        return this.client.authenticate(user, password).then(function (token) {
          this.token = token;

          if (remember) {
            localStorage.setItem('st2Session', JSON.stringify({
              url: url,
              token: token
            }));
          }
        }.bind(this));
      }

      return $q(function (resolve) {
        resolve(this.client);
      });
    };

    this.disconnect = function () {
      this.client = null;
      localStorage.removeItem('st2Session');

      return this;
    };

    try {
      var session = JSON.parse(localStorage.getItem('st2Session'));
      this.token = session.token || {};
      this.url = session.url;
    } catch (e) {}

    if (this.url && this.token) {
      this.client = initClient(this.url, this.token);
    }

    return this;
  });
