import validator from 'validator';

import { BaseTextField } from './base';

export default class NumberField extends BaseTextField {
  static icon = '.5'

  fromStateValue(v) {
    return v !== '' ? validator.toFloat(v) : void 0;
  }

  toStateValue(v) {
    return v && v.toString(10);
  }

  validate(v, spec={}) {
    return v !== '' ? validator.isFloat(v) : !spec.required;
  }
}
