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
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import {
  Label,
  ErrorMessage,
  Description,
} from '../wrappers';

export default class CheckboxModule extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    name: PropTypes.string,
    disabled: PropTypes.bool,
    spec: PropTypes.object,
    data: PropTypes.bool,
    onChange: PropTypes.func,
  }

  state = {
    error: null,
  }

  onChange(value) {
    this.props.onChange(value);
  }

  render() {
    const { className = '', name, disabled, spec, data = false } = this.props;

    return (
      <div className={cx('st2-form-checkbox', className)}>
        <Label spec={spec}>
          <div className="st2-auto-form__title">
            <input
              type="checkbox"
              className="st2-auto-form__checkbox"
              disabled={disabled}
              checked={data}
              onChange={({ target: { checked } }) => this.onChange(checked)}
              data-test={`field:${name}`}
            />

            <span className="st2-auto-form__checkbox-label">{ spec.name || name }</span>
          </div>

          <ErrorMessage>{ this.state.error }</ErrorMessage>
        </Label>

        <Description spec={spec} />
      </div>
    );
  }
}
