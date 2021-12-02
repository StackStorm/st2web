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

export default class NumberField extends BaseTextField {
  static icon = '.5'

  fromStateValue(v) {
    if (isJinja(v)) {
      return v;
    }

    if (isYaql(v)) {
      return v;
    }

    return v !== '' ? validator.toFloat(v) : void 0;
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

    return v && !validator.isFloat(v) && `'${v}' is not a number`;
  }
}
