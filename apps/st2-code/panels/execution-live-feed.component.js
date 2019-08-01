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

import { PropTypes } from 'prop-types';

import api from '@stackstorm/module-api';

import BaseCode from './base.component';


export default class LiveFeed extends BaseCode {
  static propTypes = {
    id: PropTypes.string,
  }

  async fetchLive({ id }) {
    const def = {
      backUrl: `/history/${id}/general`,
    };

    this._stream = await api.listenResults(id, e => this.handlePartialResult(e));
      
    return {
      ...def,
      code: '',
      warning: 'The execution is yet to produce any live output',
    };
  }

  async fetchStatic({ id }) {
    const def = {
      backUrl: `/history/${id}/general`,
    };

    const res = await api.request({ path: `/executions/${id}/output` });
    return {
      ...def,
      code: res || '// Action produced no output',
    };
  }

  async fetch(props) {
    if (!api.server.stream) {
      return {
        ...await this.fetchStatic(props),
        warning: 'To see live updates, you need to explicitlty specify Stream URL in your config.js. Relogin after you do.',
      };
    }

    return this.fetchLive(props);
  }

  async handlePartialResult(event) {
    const partial = JSON.parse(event.data);
    const { code } = this.state;

    this.setState({ code: `${code || ''}${partial.data}`, warning: false });
  }

  componentWillUnmount() {
    super.componentWillUnmount && super.componentWillUnmount();

    if (this._stream) {
      this._stream.close();
    }
  }
}
