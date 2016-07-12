import validator from 'validator';

import { BaseTextField } from './base';

const typeChecks = (type, v) => {
  switch (type) {
    case 'number':
      return !validator.isFloat(v) && `'${v}' is not a number`;
    case 'integer':
      return !validator.isInt(v) && `'${v}' is not an integer`;
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
    .map(v => v.trim())
    .filter(v => v.length)
    ;
}

export default class ArrayField extends BaseTextField {
  static icon = '[ ]'

  fromStateValue(value) {
    const { items } = this.props.spec;
    return value === '' ? void 0 : split(value)
      .map(v => typeConversions(items && items.type, v))
      ;
  }

  toStateValue(value) {
    return value && value.join(', ');
  }

  validate(value, spec={}) {
    const invalid = super.validate(value, spec);
    if (invalid !== void 0) {
      return invalid;
    };

    const { required, items } = spec;

    const list = split(value);

    if (!list.length && required) {
      return 'parameter is required';
    }

    const invalidItem = list.find(v => typeChecks(items && items.type, v));

    return invalidItem && typeChecks(items && items.type, invalidItem);
  }
}
