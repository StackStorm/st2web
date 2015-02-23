/*global st2client:true*/
// ^^ we should not use st2api global variable anywhere else outside the module
'use strict';

angular.module('main')
  .service('st2api', function (st2Config, $q, $rootScope) {
    this.token = {};

    var initClient = function (server, token) {
      var parser = document.createElement('a');
      parser.href = _.find(st2Config.hosts, {url: server.url}) && server.url || _.first(st2Config.hosts).url;

      var client = st2client({
        protocol: parser.protocol.split(':')[0],
        host: parser.hostname,
        port: parser.port,
        token: !_.isEmpty(token) ? token : undefined
      });

      client.executions.limit = $rootScope.limit = 50;

      return client;
    };

    this.connect = function (server, user, password, remember) {

      this.client = initClient(server, this.token);
      this.server = server;

      var promise;

      if (server.auth && user && password) {
        promise = this.client.authenticate(user, password).then(function (token) {
          this.token = token;
        }.bind(this));
      } else {
        promise = $q(function (resolve) {
          resolve(this.client);
        }.bind(this));
      }

      return promise.then(function () {
        if (remember) {
          localStorage.setItem('st2Session', JSON.stringify({
            server: server,
            token: this.token
          }));
        }
      }.bind(this));
    };

    this.disconnect = function () {
      this.client = null;
      localStorage.removeItem('st2Session');

      return this;
    };

    this.isConnected = function () {
      if (this.server && this.server.auth) {
        var expiry = this.token.expiry && new Date(this.token.expiry)
        , now = new Date()
        ;

        return now < expiry;
      } else {
        return !!this.client;
      }
    };

    try {
      var session = JSON.parse(localStorage.getItem('st2Session'));
      this.token = session.token || {};
      this.server = session.server;
    } catch (e) {}

    if (this.server && this.token) {
      this.client = initClient(this.server, this.token);
    }

    return this;
  });
