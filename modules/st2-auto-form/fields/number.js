import validator from 'validator';

import { BaseTextField, isJinja } from './base';

export default class NumberField extends BaseTextField {
  static icon = '.5'

  fromStateValue(v) {
    if (isJinja(v)) {
      return v;
    }

    return v !== '' ? validator.toFloat(v) : void 0;
  }

  toStateValue(v) {
    if (isJinja(v)) {
      return v;
    }

    return v ? v.toString(10) : '';
  }

  validate(v, spec={}) {
    const invalid = super.validate(v, spec);
    if (invalid !== void 0) {
      return invalid;
    }

    return v && !validator.isFloat(v) && `'${v}' is not a number`;
  }
}
