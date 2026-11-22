// Copyright 2019 Extreme Networks, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import _ from 'lodash';
import axios from 'axios';

let _source;

function toBase64(str) {
  if (global.window && window.btoa) {
    return btoa(str);
  }
  else {
    return global.Buffer.from(str.toString(), 'binary').toString('base64');
  }
}

// Fill in the current hostname for URLs that only name a port, e.g. "https://:443/api".
// Anything else (including protocol-relative "//host:port/api") is returned unchanged.
function localize(urlString) {
  return urlString.replace(
    /^([a-z][a-z0-9+.-]*:)\/\/:(\d+)/i,
    (match, protocol, port) => `${protocol}//${window.location.hostname}:${port}`
  );
}

export class API {
  constructor() {
    this.token = null;

    const { server, token } = this.readPersistent();

    if (server && token) {
      this.token = token;
      this.server = server;
    }
  }

  readPersistent() {
    try {
      return JSON.parse(localStorage.getItem('st2Session')) || {};
    }
    catch (e) {
      return {};
    }
  }

  async connect(server, username, password, remember) {
    const { token, url, api=url, stream } = server || {};
    let { auth } = server || {};

    if (auth === true) {
      auth = api;
    }

    if (api) {
      this.server = {
        api: localize(api),
        auth: localize(auth),
        stream: stream && localize(stream),
        token: !_.isEmpty(token) ? token : undefined,
      };
    }
    else {
      this.server = {
        api: `${window.location.protocol || 'https:'}//${window.location.host}/api`,
        auth: `${window.location.protocol || 'https:'}//${window.location.host}/auth`,
        stream: `${window.location.protocol || 'https:'}//${window.location.host}/stream`,
        token: !_.isEmpty(token) ? token : null,
      };
    }

    window.name = `st2web+${this.server.api}`;

    if (this.server.auth && username && password) {
      try {
        const res = await axios({
          method: 'post',
          url: `${this.server.auth || this.server.api}/tokens`,
          headers: {
            'Authorization': `Basic ${toBase64(`${username}:${password}`)}`,
            'content-type': 'application/json',
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
        server: this.server,
        token: this.token,
      }));
      localStorage.setItem('logged_in',JSON.stringify({
        loggedIn: true,
      }));
    }
  }

  disconnect() {
    this.token = null;
    this.server = null;
    localStorage.removeItem('st2Session');
    localStorage.removeItem('logged_in');

  }

  isConnected() {
    if (!this.token || !this.server) {
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
    } = opts;

    const verPath = version ? `/${_.trim(version, '/')}` : '';

    return `${this.server.api}${verPath}${path}`;
  }

  async request(opts, data) {
    const {
      method = 'get',
      query,
      raw = false,
    } = opts;

    const headers = {
      'content-type': 'application/json',
    };

    if (this.token && this.token.token) {
      headers['x-auth-token'] = this.token.token;
    }

    const config = {
      method,
      url: this.route(opts),
      // The API takes list filters as comma-separated values (?status=failed,canceled).
      params: query && _.mapValues(query, param => _.isArray(param) ? param.join(',') : param),
      headers,
      transformResponse: [ function transformResponse(data, headers) {
        if (typeof data === 'string' && headers['content-type'] &&
            headers['content-type'].indexOf('application/json') > -1) {
          try {
            data = JSON.parse(data);
          }
          catch (e) {
            /* Ignore */
          }
        }

        return data;
      } ],
      data,
      withCredentials: true,
      // responseType: 'json',
    };

    // Node only (the client is also used outside the browser); browsers have no `process`.
    if (typeof process !== 'undefined' && process.env) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = this.rejectUnauthorized === false ? '0' : '1';
    }

    const response = await axios(config);
    const contentType = (response.headers || {})['content-type'] || [];
    // axios lower-cases response header names.
    const requestId = (response.headers || {})['x-request-id'] || null;

    response.headers = response.headers || {};
    response.statusCode = response.status;
    response.body = response.data;

    if (requestId) {
      response.requestId = requestId;
    }

    if (raw) {
      return response;
    }

    if (contentType.indexOf('application/json') !== -1) {
      if (typeof response.body === 'string' || response.body instanceof String) {
        response.body = JSON.parse(response.body);
      }
    }

    return response.data;
  }

  listen() {
    const streamUrl = `${this.server.stream || this.server.api}/stream`;

    return _source = _source || this.createStream(streamUrl);
  }

  async listenEvents(eventnames, callback) {
    const events = [].concat(eventnames);
    const streamUrl = `${this.server.stream || this.server.api}/stream?events=${events.join(',')}`;

    const stream = await this.createStream(streamUrl);

    for (const eventName of events) {
      stream.addEventListener(eventName, callback);
    }

    return stream;
  }

  async listenResults(executionId, callback) {
    const streamUrl = `${this.server.stream}/executions/${executionId}/output`;

    const stream = await this.createStream(streamUrl);

    stream.addEventListener('st2.execution.output__create', callback);
    stream.addEventListener('EOF', () => stream.close());

    return stream;
  }

  createStream(streamUrl) {
    return new Promise((resolve, reject) => {
      try {
        const source = new EventSource(streamUrl, {
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

const st2api = new API();

export default st2api;
