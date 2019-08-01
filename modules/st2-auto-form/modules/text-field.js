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

import st2ValueFormat from '@stackstorm/module-value-format';

export default class TextFieldModule extends React.Component {
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

  componentDidUpdate() {
    if (!this._textarea) {
      return;
    }

    this._textarea.style.height = 0;
    this._textarea.style.height = `${this._textarea.scrollHeight}px`;
  }

  onRef(textarea) {
    this._textarea = textarea;
    if (!this._textarea) {
      return;
    }

    const minRows = 1;
    const maxRows = 3;

    const computed = window.getComputedStyle(this._textarea);
    const lineHeight = parseInt(computed.lineHeight);
    const paddings = parseInt(computed.paddingTop) + parseInt(computed.paddingBottom);
    const minHeight = paddings + minRows * lineHeight;
    const maxHeight = paddings + maxRows * lineHeight;

    this._textarea.style.minHeight = `${minHeight}px`;
    this._textarea.style.maxHeight = `${maxHeight}px`;
    this._textarea.style.height = 0;
    this._textarea.style.height = `${this._textarea.scrollHeight}px`;
  }

  onChange(value) {
    const { spec } = this.props;

    if (spec.pattern) {
      if (!value.match(new RegExp(`/${spec.pattern}/`))) {
        this.setState({ error: `The value must match "${spec.pattern}".` });
        return;
      }
    }

    if (spec.format) {
      if (!st2ValueFormat(spec.format, value)) {
        this.setState({ error: `The value must be of type "${spec.format}".` });
        return;
      }
    }

    this.state.error && this.setState({ error: null });
    this.props.onChange(value);
  }

  render() {
    const { className = '', name, disabled, spec, data = '' } = this.props;

    return (
      <div className={cx('st2-form-text-field', className)}>
        <Label spec={spec} className="st2-auto-form__text-field">
          <Title name={name} spec={spec} />

          <textarea
            className="st2-auto-form__field"
            placeholder={spec.default}
            required={spec.required}
            disabled={disabled}
            minLength={spec.minLength}
            maxLength={spec.maxLength}
            onChange={({ target: { value } }) => this.onChange(value)}
            ref={(ref) => this.onRef(ref)}
            value={data}
            data-test={`field:${name}`}
          />

          <ErrorMessage>{ this.state.error }</ErrorMessage>
        </Label>

        <Description spec={spec} />
      </div>
    );
  }
}
