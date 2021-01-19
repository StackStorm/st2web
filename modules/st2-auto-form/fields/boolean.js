// Copyright 2021 The StackStorm Authors.
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

import React from 'react';

import { BaseTextField } from './base';
import { BooleanFieldWrapper } from '../wrappers';

export default class BooleanField extends BaseTextField {
  toStateValue(v) {
    return v !== void 0 ? !!v : false;
  }

  fromStateValue(v) {
    return v !== void 0 ? !!v : false;
  }

  validate(v) {
    return v !== void 0 && typeof v !== 'boolean'  && `'${v}' is not boolean`;
  }

  render() {
    const wrapperProps = Object.assign({}, this.props, {
      onReset: (e) => this.handleChange(e,false),
    });

    const inputProps = {
      className: 'st2-auto-form__checkbox',
      disabled: this.props.disabled,
      checked: !this.validate(this.state.value) && this.state.value,
      onChange: (e) => this.handleChange(e, e.target.checked),
    };

    if (this.props.spec.default && this.props.value === void 0) {
      inputProps.className += ' ' + 'st2-auto-form__checkbox--default';
    }

    return (
      <BooleanFieldWrapper {...wrapperProps}>
        <input type="checkbox" {...inputProps} />
      </BooleanFieldWrapper>
    );
  }
}
