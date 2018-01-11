import _ from 'lodash';
import st2client from 'st2client';
import URI from 'urijs';

export class API {
  constructor(servers) {
    this.servers = servers;
    this.token = {};

    try {
      const session = JSON.parse(localStorage.getItem('st2Session'));
      this.token = session.token || {};
      this.server = session.server;
    }
    catch (e) {
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
        if (_.find(this.servers, { url: server.url })) {
          return server.url;
        }
        else {
          return _.first(this.servers).url;
        }
      })();

      const api = URI.parse(url);

      if (api.port && !api.hostname) {
        api.hostname = window.location.hostname;
      }

      opts = {
        protocol: api.protocol,
        host: api.hostname,
        port: api.port,
        prefix: api.path,
        token: !_.isEmpty(token) ? token : undefined,
      };

      if (server.auth && _.isString(server.auth)) {
        const auth = URI.parse(server.auth);

        if (auth.port && !auth.hostname) {
          auth.hostname = window.location.hostname;
        }

        opts.auth = {
          protocol: auth.protocol,
          host: auth.hostname,
          port: auth.port,
          prefix: auth.path,
        };
      }
    }
    else {
      opts = {
        api: `https://${window.location.hostname}:443/api`,
        auth: `https://${window.location.hostname}:443/auth`,
        token: !_.isEmpty(token) ? token : undefined,
      };
    }

    const client = st2client(opts);

    window.name = `st2web+${client.index.url}`;

    return client;
  }

  connect(server, username, password, remember) {
    this.client = this.initClient(server, this.token);
    this.server = server;

    let promise;

    if (server.auth && username && password) {
      promise = this.client.authenticate(username, password)
        .catch((err) => {
          if (err.status === 0) {
            throw {
              name: 'RequestError',
              message: `Unable to reach auth service. [auth:${server.auth}]`,
            };
          }

          if (err.response && err.response.data.faultstring) {
            throw {
              name: err.response.statusText,
              message: err.response.data.faultstring,
            };
          }

          throw err;
        })
        .then((token) => {
          this.token = token;
        });
    }
    else {
      promise = Promise.resolve(this.client);
    }

    return promise.then(() => {
      if (remember) {
        localStorage.setItem('st2Session', JSON.stringify({
          server: server,
          token: this.token,
        }));
      }
    });
  }

  disconnect() {
    this.client = null;
    this.token = {};
    localStorage.removeItem('st2Session');

    return this;
  }

  isConnected() {
    if (this.server && this.server.auth) {
      const expiry = this.token.expiry && new Date(this.token.expiry);
      const now = new Date();

      return now < expiry;
    }
    else {
      return !!this.client;
    }
  }
}

const st2api = new API(window.st2constants.st2Config.hosts);

export default st2api;
