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
