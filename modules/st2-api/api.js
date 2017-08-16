import _ from 'lodash';
import st2client from 'st2client';
import URI from 'urijs';

const st2Config = {

  hosts: [{
    name: 'Dev Env',
    url: 'https://192.168.1.31/api',
    auth: 'https://192.168.1.31/auth'
  // }, {
  //   name: 'Express',
  //   url: '//172.168.90.50:9101',
  //   auth: true
  }]

};

class API {
  constructor() {
    this.servers = st2Config.hosts;
    this.token = {};

    try {
      var session = JSON.parse(localStorage.getItem('st2Session'));
      this.token = session.token || {};
      this.server = session.server;
    } catch (e) {
      // do nothing
    }

    if (this.server && this.token) {
      this.client = this.initClient(this.server, this.token);
    }
  }

  initClient(server, token) {
    let opts;

    if (this.servers) {
      const url = (() => {
        if (_.find(this.servers, {url: server.url})) {
          return server.url;
        } else {
          return _.first(this.servers).url;
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
        api: 'https://' + window.location.hostname + ':443/api',
        auth: 'https://' + window.location.hostname + ':443/auth',
        token: !_.isEmpty(token) ? token : undefined
      };
    }

    var client = st2client(opts);

    window.name = 'st2web+' + client.index.url;

    return client;
  }

  connect(server, user, password, remember) {
    this.client = this.initClient(server, this.token);
    this.server = server;

    let promise;

    if (server.auth && user && password) {
      promise = this.client.authenticate(user, password)
        .catch(function (err) {
          if (err.status === 0) {
            throw {
              name: 'RequestError',
              message: 'Unable to reach auth service. [auth:' + server.auth + ']'
            };
          }

          throw err;
        })
        .then(function (token) {
          this.token = token;
        }.bind(this));
    } else {
      promise = Promise.resolve(this.client);
    }

    return promise.then(() => {
      if (remember) {
        localStorage.setItem('st2Session', JSON.stringify({
          server: server,
          token: this.token
        }));
      }
    });
  }

  disconnect() {
    this.client = null;
    localStorage.removeItem('st2Session');

    return this;
  }

  isConnected() {
    if (this.server && this.server.auth) {
      var expiry = this.token.expiry && new Date(this.token.expiry)
      , now = new Date()
      ;

      return now < expiry;
    } else {
      return !!this.client;
    }
  }
}

const st2api = new API();

export default st2api;
