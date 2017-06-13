import validator from 'validator';
import _ from 'lodash';

import { BaseTextField } from './base';

const typeChecks = (type, v) => {
  switch (type) {
    case 'number':
      return !validator.isFloat(v) && `'${v}' is not a number`;
    case 'integer':
      return !validator.isInt(v) && `'${v}' is not an integer`;
    case 'object':
      return !_.isPlainObject(v) && `'${v}' is not an object`;
    case 'string':
    default:
      return false;
  }
};

export default class ArrayField extends BaseTextField {
  static icon = '[ ]'
  fromStateValue(v) {
    const { items } = this.props.spec;
    return v !== '' ? JSON.parse(v) : void 0;
  }

  toStateValue(v) {
    return JSON.stringify(v);
  }

  validate(v, spec={}) {
    try {
      const { items } = this.props.spec;
      const o = v && JSON.parse(v);
      if (o && !_.isArray(o)) {
        return 'value is not an array';
      }
      const invalidItem = o.find(value => typeChecks(items && items.type, value));
      return invalidItem && typeChecks(items && items.type, invalidItem);
    } catch(e) {
      return e.message;
    }
  }
}
