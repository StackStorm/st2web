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
  Title,
  ErrorMessage,
  Description,
} from '../wrappers';

export default class SelectModule extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    name: PropTypes.string,
    disabled: PropTypes.bool,
    spec: PropTypes.object,
    data: PropTypes.string,
    onChange: PropTypes.func,
  }

  state = {
    error: null,
  }

  onChange(value) {
    this.state.error && this.setState({ error: null });
    this.props.onChange(value);
  }

  render() {
    const { className = '', name, disabled, spec, data = '' } = this.props;
    const options = Array.isArray(spec.enum)
      ? spec.enum
      : Object.keys(spec.enum).map((value) => ({ value, label: `${spec.enum[value]} (${value})` }))
    ;

    return (
      <div className={cx('st2-auto-form-select', className)}>
        <Label spec={spec} className="st2-auto-form__select">
          <Title name={name} spec={spec} />

          <select
            className="st2-auto-form__field"
            required={spec.required}
            disabled={disabled}
            onChange={({ target: { value } }) => this.onChange(value)}
            value={data}
            data-test={`field:${name}`}
          >
            { options.map(({ value, label }) => (
              <option
                key={value}
                value={value}
                label={label}
              >
                { label }
              </option>
            )) }
          </select>

          <ErrorMessage>{ this.state.error }</ErrorMessage>
        </Label>

        <Description spec={spec} />
      </div>
    );
  }
}
