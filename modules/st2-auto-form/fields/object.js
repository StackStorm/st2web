import _ from 'lodash';
import { BaseTextareaField, isJinja } from './base';

export default class ObjectField extends BaseTextareaField {
  static icon = '{ }'

  fromStateValue(v) {
    if (isJinja(v)) {
      return v;
    }

    return v !== '' && v !== undefined ? JSON.parse(v) : void 0;
  }

  toStateValue(v) {
    if (isJinja(v)) {
      return v;
    }

    return JSON.stringify(v || {});
  }

  validate(v, spec) {
    const invalid = super.validate(v, spec);
    if (invalid !== void 0) {
      return invalid;
    }

    try {
      const o = v && JSON.parse(v);
      if (o && !_.isPlainObject(o)) {
        return 'value is not an object';
      }

      return false;
    }
    catch(e) {
      return e.message;
    }
  }
}
