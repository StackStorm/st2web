import validator from 'validator';

import { BaseTextField } from './base';

export default class IntegerField extends BaseTextField {
  static icon = '12'

  fromStateValue(v) {
    return v !== '' ? validator.toInt(v, 10) : void 0;
  }

  toStateValue(v) {
    return v && v.toString(10);
  }

  validate(v, spec={}) {
    return v !== '' ? validator.isInt(v) : !spec.required;
  }
}
