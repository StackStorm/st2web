import fp from 'lodash/fp';
import { PropTypes } from 'prop-types';

import api from '@stackstorm/module-api';

import BaseCode from './base.component';


export default class EntrypointCode extends BaseCode {
  static propTypes = {
    id: PropTypes.string,
  }

  async fetch({ id }) {
    const def = {
      backUrl: `/actions/${id}/entrypoint`,
    };

    try {
      const res = await api.request({ path: `/actions/views/entry_point/${id}`, raw: true });
      return {
        ...def,
        code: res.data,
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
