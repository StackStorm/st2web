import { BaseTextareaField } from './base';

export default class StringField extends BaseTextareaField {
  static icon = 'T'

  fromStateValue(v) {
    return v !== '' ? v : void 0;
  }

  toStateValue(v) {
    return v || '';
  }
}
