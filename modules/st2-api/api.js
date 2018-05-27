import _ from 'lodash';
import url from 'url';
import axios from 'axios';

let _source;

function toBase64(str) {
  if (global.window && window.btoa) {
    return btoa(str);
  }
  else {
    return new global.Buffer(str.toString(), 'binary').toString('base64');
  }
}

function localize(urlString) {
  const { hostname, port, ...rest } = url.parse(urlString);

  delete rest.host;

  return url.format({
    hostname: hostname || port && window.location.hostname,
    port,
    ...rest,
  });
}

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

  initClient({ url }, token) {
    if (this.servers) {
      const server = _.find(this.servers, { url }) || _.first(this.servers);

      this.opts = {
        api: localize(server.url),
        auth: server.auth && _.isString(server.auth) && localize(server.auth),
        stream: server.stream && _.isString(server.stream) && localize(server.stream),
        token: !_.isEmpty(token) ? token : undefined,
      };
    }
    else {
      this.opts = {
        api: `https://${window.location.host}/api`,
        auth: `https://${window.location.host}/auth`,
        stream: `https://${window.location.host}/stream`,
        token: !_.isEmpty(token) ? token : null,
      };
    }

    window.name = `st2web+${this.opts.api}`;
  }

  async connect(server, username, password, remember) {
    this.initClient(server, this.token);
    this.server = server;

    if (server.auth && username && password) {
      try {
        const res = await axios({
          method: 'post',
          url: `${this.opts.auth || this.opts.api}/tokens`,
          headers: {
            'Authorization': `Basic ${toBase64(`${username}:${password}`)}`,
          },
        });

        if (res.status !== 201) {
          throw {
            name: 'APIError',
            status: res.status,
            message: res.data.faultstring || res.data,
          };
        }
  
        this.token = res.data;
      }
      catch (err) {
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
      }
    }

    if (remember) {
      localStorage.setItem('st2Session', JSON.stringify({
        server: server,
        token: this.token,
      }));
    }
  }

  disconnect() {
    this.token = null;
    localStorage.removeItem('st2Session');
  }

  isConnected() {
    if (!this.token) {
      return false;
    }

    const expiry = this.token.expiry && new Date(this.token.expiry);
    const now = new Date();

    return now < expiry;
  }

  route(opts) {
    const {
      path,
      version = 'v1',
      queryToken = false,
    } = opts;

    const verPath = version ? `/${_.trim(version, '/')}` : '';
    const token = queryToken && this.token.token ? `?x-auth-token=${this.token.token}` : '';

    return `${this.opts.api}${verPath}${path}${token}`;
  }

  async request(opts, data) {
    const {
      method = 'get',
      query,
      raw = false,
    } = opts;

    const headers = {};

    if (this.token.token) {
      headers['x-auth-token'] = this.token.token;
    }

    const config = {
      method,
      url: this.route(opts),
      params: query,
      headers,
      transformResponse: [],
      data,
    };
  
    if (this.rejectUnauthorized === false) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
    }
  
    const response = await axios(config);

    const contentType = (response.headers || {})['content-type'] || [];
    const requestId = (response.headers || {})['X-Request-ID'] || null;

    response.headers = response.headers || {};
    response.statusCode = response.status;
    response.body = response.data;

    if (requestId) {
      response.requestId = requestId;
    }

    if (contentType.indexOf('application/json') !== -1) {
      if (typeof response.body === 'string' || response.body instanceof String) {
        response.body = JSON.parse(response.body);
      }
    }

    if (raw) {
      return response;
    }

    return response.data;
  }

  listen() {
    return new Promise((resolve, reject) => {
      const streamUrl = `${this.opts.stream || this.opts.api}/stream${this.token.token && `?x-auth-token=${this.token.token}`}`;

      try {
        const source = _source = _source || new EventSource(streamUrl, {
          rejectUnauthorized: this.rejectUnauthorized,
          withCredentials: true,
        });
        return resolve(source);
      }
      catch(e) {
        return reject(e);
      }
    });
  }

  wait(eventType, condition) {
    return this.listen()
      .then(source => {
        let listener;

        return new Promise((resolve, reject) => {
          listener = event => {
            const record = JSON.parse(event.data);

            const result = condition(record);

            if (result === true) {
              resolve(record);
            }
            else if (result === false) {
              reject(record);
            }
          };
          source.addEventListener(eventType, listener);
        })
          .then(record => {
            source.removeEventListener(eventType, listener);

            return record;
          })
          .catch(record => {
            source.removeEventListener(eventType, listener);

            throw record;
          });
      });
  }
}

const st2api = new API(window.st2constants.st2Config.hosts);

export default st2api;
