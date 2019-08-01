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

import { uniqueId } from 'lodash';
import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import './style.css';

export class Toggle extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    onChange: PropTypes.func,
    value: PropTypes.bool,
  }

  _id = uniqueId('st2toggle')
  
  handleChange(value) {
    return this.props.onChange && this.props.onChange(value);
  }

  render() {
    const { title, value } = this.props;

    return (
      <div className="st2-forms__switch">
        <input id={this._id} type="checkbox" checked={value || false} onChange={({ target: { checked } }) => this.handleChange(checked)} />
        <label htmlFor={this._id} />
        <label htmlFor={this._id} className="st2-forms__switch-title">{ title }</label>
      </div>
    );
  }
}

export default class Button extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    small: PropTypes.bool.isRequired,
    flat: PropTypes.bool.isRequired,
    red: PropTypes.bool.isRequired,
    submit: PropTypes.bool.isRequired,
  }

  static defaultProps = {
    small: false,
    flat: false,
    red: false,
    submit: false,
  }

  render() {
    const { className, small, flat, red, submit, ...props } = this.props;

    return (
      <input
        {...props}
        type={submit ? 'submit' : 'button'}
        className={cx('st2-forms__button', className, {
          'st2-forms__button--small': small,
          'st2-forms__button--flat': flat,
          'st2-forms__button--red': red,
        })}
      />
    );
  }
}
