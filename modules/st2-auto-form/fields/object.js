import { BaseTextareaField } from './base';

export default class ObjectField extends BaseTextareaField {
  static icon = '{ }'

  fromStateValue(v) {
    return v !== '' ? JSON.parse(v) : void 0;
  }

  toStateValue(v) {
    return JSON.stringify(v);
  }

  validate(v) {
    try {
      v && JSON.parse(v);
      return true;
    } catch(e) {
      return false;
    }
  }
}
