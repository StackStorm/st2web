// Copyright 2019 Extreme Networks, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import _ from 'lodash';
import validator from 'validator';

import { BaseTextField, isJinja, isYaql } from './base';

const jsonCheck = (value) => {
  try {
    JSON.parse(value);
  }
  catch (e) {
    return false;
  }
  return true;
};

const jsonInArrayCheck = (value) => {
  return value.every(item => typeof(item) === 'object' );
};

const typeChecks = (type, value) => {
  const v = String(value);
  switch (type) {
    case 'number':
      return !validator.isFloat(v) && `'${v}' is not a number`;
    case 'integer':
      return !validator.isInt(v) && `'${v}' is not an integer`;
    case 'object':
      return !_.isPlainObject(value) && `'${v}' is not an object`;
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

    /* YAQL parameter that came input as single yaql */
    if (isYaql(v) && !v.includes(',')) {
      return v;
    }

    const { items } = this.props.spec || {};

    let t = v;
    /* Trim [], required for when kept [] around YAQL parameter */
    if (v && v.startsWith('[') && v.endsWith(']')) {
      t = v.substring(1, v.length-1).trim();
    }

    return split(t)
      .map((t) => typeConversions(items && items.type, t))
    ;
  }

  toStateValue(v) {

    if (jsonCheck(v)) {
      return JSON.stringify(v);
    }

    if (isJinja(v)) {
      return v;
    }

    /* string which is YAQL */
    if (isYaql(v)) {
      return v;
    }

    if (Array.isArray(v) && jsonInArrayCheck(v)) {
      return JSON.stringify(v);
    }

    const { secret } = this.props.spec || {};

    if (secret && v && !Array.isArray(v)) {
      return v;
    }

    /* 
     * Keep [] if after converting to comma separated string would be treated
     * as YAQL, as need to distingish between when pass an array parameter or
     * an array of string parameters.
     */
    if (v && Array.isArray(v) && isYaql(v.join(', ')) && v.length === 1) {
      return '[ '.concat(v.join(', '),' ]');
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
