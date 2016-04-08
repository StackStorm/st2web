import validator from 'validator';

import { BaseTextField } from './base';

const typeChecks = {
  'number': validator.isFloat,
  'integer': validator.isInt,
  'string': () => true
};

const typeConversions = {
  'number': v => validator.toFloat(v),
  'integer': v => validator.toInt(v, 10),
  'string': v => v
};

function split(value) {
  return value
    .split(',')
    .map(v => v.trim())
    .filter(v => v.length)
    ;
}

export default class ArrayField extends BaseTextField {
  static icon = '[ ]'

  fromStateValue(value) {
    return value === '' ? void 0 : split(value)
      .map(v => typeConversions[this.props.spec.items.type](v))
      ;
  }

  toStateValue(value) {
    return value && value.join(', ');
  }

  validate(value, spec={}) {
    const { required, items } = spec;

    const list = split(value);

    if (!list.length && required) {
      return false;
    }

    return list.every(v => typeChecks[items.type || 'string'](v));
  }
}
