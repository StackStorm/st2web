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

//@flow

import React, { Component } from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import style from './style.css';

export const specialProperties = [{
  name: 'required',
  description: 'The parameter could not be ommited',
}, {
  name: 'immutable',
  description: 'Prevent parameter from being overritten',
}, {
  name: 'secret',
  description: 'Mark parameter value as sensitive',
}];

export default class Parameter extends Component<{
  name: string,
  parameter: {
    type: string,
    description: string,
    immutable: bool,
    required: bool,
    secret: bool,
  },
  onEdit: Function,
  onDelete: Function,
}> {
  static propTypes = {
    name: PropTypes.string,
    parameter: PropTypes.shape({
      type: PropTypes.string,
      description: PropTypes.string,
    }),
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
  }

  handleEdit(e: Event) {
    e.stopPropagation();

    this.props.onEdit();
  }

  handleDelete(e: Event) {
    e.stopPropagation();

    this.props.onDelete();
  }

  style = style

  render() {
    const { name, parameter } = this.props;

    return (
      <div className={this.style.parameter}>
        <div className={this.style.parameterButtons}>
          <span className={cx('icon-edit', this.style.parameterButton)} onClick={e => this.handleEdit(e)} />
          <span className={cx('icon-delete', this.style.parameterButton)} onClick={e => this.handleDelete(e)} />
        </div>
        <div className={this.style.parameterName}>{ name }</div>
        <div className={this.style.parameterDescription}>{ parameter.description }</div>
        <div className={this.style.parameterTokens}>
          {
            specialProperties.map(({ name }) =>
              <div key={name} className={cx(this.style.parameterToken, parameter[name] && this.style.active)}>{ name }</div>
            )
          }
        </div>
      </div>
    );
  }
}
