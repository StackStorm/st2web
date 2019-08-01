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

import fp from 'lodash/fp';
import { PropTypes } from 'prop-types';

import api from '@stackstorm/module-api';

import BaseCode from './base.component';


export default class TriggerInstanceCode extends BaseCode {
  static propTypes = {
    id: PropTypes.string,
    back: PropTypes.string,
  }

  async fetch({ id }) {
    try {
      const res = await api.request({ path: `/triggerinstances/${id}` });
      const code = JSON.stringify(res, null, 2);
      return {
        backUrl: `/triggers/${res.trigger}/instances`,
        code,
      };
    }
    catch (e) {
      return {
        backUrl: '/history',
        code: fp.get('response.data.faultstring', e),
      };
    }
  }
}
