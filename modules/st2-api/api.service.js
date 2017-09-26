'use strict';

var _ = require('lodash')
  , st2client = require('st2client')
  , URI = require('urijs')
  ;

module.exports =
  function st2api(st2Config, $q) {
    this.token = {};

    var initClient = function (server, token) {
      var opts;

      if (st2Config.hosts) {
        var url = (function () {
          if (_.find(st2Config.hosts, {url: server.url})) {
            return server.url;
          } else {
            return _.first(st2Config.hosts).url;
          }
        })();

        var api = URI.parse(url);

        if (api.port && !api.hostname) {
          api.hostname = window.location.hostname;
        }

        opts = {
          protocol: api.protocol,
          host: api.hostname,
          port: api.port,
          prefix: api.path,
          token: !_.isEmpty(token) ? token : undefined
        };

        if (server.auth && _.isString(server.auth)) {
          var auth = URI.parse(server.auth);

          if (auth.port && !auth.hostname) {
            auth.hostname = window.location.hostname;
          }

          opts.auth = {
            protocol: auth.protocol,
            host: auth.hostname,
            port: auth.port,
            prefix: auth.path
          };
        }
      } else {
        opts = {
          api: window.location.protocol + '//' + window.location.host + '/api',
          auth: window.location.protocol + '//' + window.location.host + '/auth',
          token: !_.isEmpty(token) ? token : undefined
        };
      }

      var client = st2client(opts);

      window.name = 'st2web+' + client.index.url;

      return client;
    };

    this.connect = function (server, user, password, remember) {

      this.client = initClient(server, this.token);
      this.server = server;

      var promise;

      if (server.auth && user && password) {
        promise = this.client.authenticate(user, password).catch(function (err) {
          if (err.status === 0) {
            throw {
              name: 'RequestError',
              message: 'Unable to reach auth service. [auth:' + server.auth + ']'
            };
          }

          throw err;
        }).then(function (token) {
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
    } catch (e) {
      // do nothing
    }

    if (this.server && this.token) {
      this.client = initClient(this.server, this.token);
    }

    return this;
  };
