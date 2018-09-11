import fp from 'lodash/fp';
import { PropTypes } from 'prop-types';

import api from '@stackstorm/module-api';

import BaseCode from './base.component';


export default class ActionCode extends BaseCode {
  static propTypes = {
    id: PropTypes.string,
  }

  async fetch({ id }) {
    const def = {
      backUrl: `/actions/${id}/code`,
    };

    try {
      const res = await api.request({ path: `/actions/views/overview/${id}` });
      const code = JSON.stringify(res, null, 2);
      return {
        ...def,
        code,
      };
    }
    catch (e) {
      return {
        ...def,
        code: fp.get('response.data.faultstring', e),
      };
    }
  }
}
