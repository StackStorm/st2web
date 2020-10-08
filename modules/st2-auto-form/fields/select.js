// Copyright 2020 Extreme Networks, Inc.
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
import React from 'react';
import { BaseTextField } from './base';

export default class SelectField extends BaseTextField {
  static icon = 'V'

  fromStateValue(v) {
    return v !== '' ? v : void 0;
  }

  toStateValue(v) {
    return v || '';
  }

  validate(v, spec={}) {
    const invalid = super.validate(v, spec);
    if (invalid !== void 0) {
      return invalid;
    }

    return v && !spec.options.find(o => o.value === v) && `'${v}' is not a valid item`;
  }

  render() {
    const { spec={} } = this.props;
    const { value } = this.state;

    const selectProps = {
      className: 'st2-auto-form__field',
      disabled: this.props.disabled,
      value,
      onChange: (e) => this.handleChange(e, e.target.value),
    };

    if (this.state.invalid) {
      selectProps.className += ' ' + 'st2-auto-form__field--invalid';
    }

    return (
      <div className="st2-auto-form__select">
        <select {...selectProps}>
          { spec.default ? null : (
            <option value='' />
          ) }
          { _.map(spec.options, (o) => (
            <option key={o.value} value={o.value}>{ o.text }</option>
          ) ) }
        </select>
      </div>
    );
  }
}
