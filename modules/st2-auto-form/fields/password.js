import { BaseTextField } from './base';

export default class PasswordField extends BaseTextField {
  static icon = '**'

  fromStateValue(v) {
    return v !== '' ? v : void 0;
  }

  toStateValue(v) {
    return v || '';
  }
}
