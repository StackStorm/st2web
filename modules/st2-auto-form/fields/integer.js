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

import validator from 'validator';

import { BaseTextField, isJinja, isYaql } from './base';

export default class IntegerField extends BaseTextField {
  static icon = '12'

  fromStateValue(v) {
    if (isJinja(v)) {
      return v;
    }

    if (isYaql(v)) {
      return v;
    }

    if (this.props.name === 'timeout' || this.props.name === 'limit') {
      return v ;
    }
    else {
      return v  !== '' ? validator.toInt(v, 10) : void 0;
    }
  }

  toStateValue(v) {
    if (isJinja(v)) {
      return v;
    }

    if (isYaql(v)) {
      return v;
    }

    return v ? v.toString(10) : '';
  }

  validate(v, spec={}) {
    const invalid = super.validate(v, spec);
    if (invalid !== void 0) {
      return invalid;
    }

    if (spec._name === 'timeout' || spec._name === 'limit') {
      for (let n = 0; n < v.length; n += 1) {
        const digit = (v.charCodeAt(n) >= 48 && v.charCodeAt(n) <= 57) || v.charCodeAt(n) === 45  || v.charCodeAt(n) === 8;
        if (!digit) {
          return `'${v}' must be a positive integer`;
        }
        else {
          if (v < 0) {
            return 'Value must be > 0';
          }
          else if (v > 2592000) {
            return 'Value must be <= 2592000';
          } 
          
        }
      } 
    }

    return v && !validator.isInt(v) && `'${v}' is not an integer`;
  }
}
