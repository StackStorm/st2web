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
