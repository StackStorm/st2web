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


export default class ResultCode extends BaseCode {
  static propTypes = {
    id: PropTypes.string,
  }

  async fetch({ id }) {
    const def = {
      backUrl: `/history/${id}/general`,
    };

    const res = await api.request({
      path: `/executions/${id}`,
      query: {
        include_attributes: 'result',
      },
    });

    const code = res.result ? JSON.stringify(res.result, null, 2) : '// Action produced no data';

    return {
      ...def,
      code,
    };
  }
}
