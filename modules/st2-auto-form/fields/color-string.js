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

import React from 'react';
import PropTypes from 'prop-types';
import StringField from './string';
import { Label, Icon, ErrorMessage, Description, Title } from '../wrappers';
export default class ColorStringField extends StringField {
  static icon = 'V';

  static propTypes = {
    name: PropTypes.string,
    spec: PropTypes.object,
    value: PropTypes.any,
    invalid: PropTypes.string,
    disabled: PropTypes.bool,
    icon: PropTypes.string,
    labelClass: PropTypes.string,
    options: PropTypes.array,
  }
  render() {
    const { icon } = this.constructor;
    const { invalid, open, value } = this.state;
    const { spec={}, options } = this.props;

    const wrapperProps = Object.assign({}, this.props);

    if (invalid) {
      wrapperProps.invalid = invalid;
    }

    const inputProps = {
      className: 'st2-auto-form__field',
      placeholder: this.toStateValue(spec.default),
      disabled: this.props.disabled,
      value: value,
      onChange: (e) => this.handleChange(e, e.target.value || ''),
      'data-test': this.props['data-test'],
      style: { paddingLeft: 23 }, // extra padding so the color block can show up in the field
    };

    if (this.state.invalid) {
      inputProps.className += ' ' + 'st2-auto-form__field--invalid';
    }

    return (
      <div className="st2-auto-form__select">
        <div className='st2-auto-form__line'>
          <Label className={this.props.labelClass || 'st2-auto-form__text-field'}>
            {options && (
              <Icon  name={icon} style={{pointerEvents:'initial'}} />
            )}
            <Title {...this.props} />
            <span className="st2-auto-form__field-color-block" style={{backgroundColor: value}}>&nbsp;</span>
            <input {...inputProps} onClick={() => this.setState({ open: !open })} />
            { options && open && (
              <div className="st2-auto-form__field-options" onClick={() => this.setState({open: false})}>
                <div className="st2-auto-form__field-options-menu">
                  {options.map(color => (
                    <div key={`color-${color.replace(/^[A-Z0-9]/ig, '')}`} className="st2-auto-form__field-options-menu-item">
                      <button
                        className="st2-auto-form__field-options-menu-item-button"
                        onClick={(e) => {
                          this.handleChange(e, color);
                          this.setState({open: false});
                        }}
                      >
                        <div style={{backgroundColor: color}}>&nbsp;</div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <ErrorMessage>{ this.props.invalid }</ErrorMessage>
          </Label>
          <Description {...this.props} />
        </div>
      </div>
    );
  }
}
