import _ from 'lodash';
import validator from 'validator';

import { BaseTextField, isJinja } from './base';

const jsonCheck = (value) => {
  try {
    JSON.parse(value);
  }
  catch (e) {
    return false;
  }
  return true;
};

const typeChecks = (type, value) => {
  const v = String(value);
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

const typeConversions = (type, v) => {
  switch(type) {
    case 'number':
      return validator.toFloat(v);
    case 'integer':
      return validator.toInt(v, 10);
    case 'string':
    default:
      return v;
  }
};

function split(value) {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length)
  ;
}

export default class ArrayField extends BaseTextField {
  static icon = '[ ]'

  fromStateValue(v) {
    if (v === '') {
      return void 0;
    }

    if (jsonCheck(v)) {
      return JSON.parse(v);
    }

    if (isJinja(v)) {
      return v;
    }

    const { items } = this.props.spec || {};
    return split(v)
      .map((v) => typeConversions(items && items.type, v))
    ;
  }

  toStateValue(v) {
    if (jsonCheck(v)) {
      return JSON.stringify(v);
    }

    if (isJinja(v)) {
      return v;
    }

    const { secret } = this.props.spec || {};
    if (secret && v && !Array.isArray(v)) {
      return v;
    }

    return v ? v.join(', ') : '';
  }

  validate(value, spec={}) {
    const invalid = super.validate(value, spec);
    if (invalid !== void 0) {
      return invalid;
    }

    if (jsonCheck(value)) {
      try {
        const { items } = this.props.spec;
        const o = value && JSON.parse(value);
        if (o && !_.isArray(o)) {
          return 'value is not an array';
        }
        const invalidItem = o.find((v) => typeChecks(items && items.type, v));
        return invalidItem && typeChecks(items && items.type, invalidItem);
      }
      catch(e) {
        return e.message;
      }
    }
    else {
      const { required, items } = spec;

      const list = split(value);

      if (!list.length && required) {
        return 'parameter is required';
      }

      const invalidItem = list.find((v) => typeChecks(items && items.type, v));

      return invalidItem && typeChecks(items && items.type, invalidItem);
    }
  }
}
