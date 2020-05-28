// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

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
