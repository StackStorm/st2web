// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

//@flow

import type { Node } from 'react';

import React, { Component } from 'react';
import { PropTypes } from 'prop-types';

import { Toggle } from '@stackstorm/module-forms/button.component';

import style from './style.css';

export default class Property extends Component<{
  name: string,
  description: string,
  value: bool,
  onChange: Function,
  children?: Node
}> {
  static propTypes = {
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    value: PropTypes.bool,
    onChange: PropTypes.func,
    children: PropTypes.node,
  }

  style = style

  render() {
    const { name, description, value, onChange, children } = this.props;
    return (
      <div className={this.style.property}>
        <div className={this.style.propertyName}>{ name }</div>
        <div className={this.style.propertyDescription}>{ description }</div>
        <div className={this.style.propertyToggle}>
          <Toggle value={value} onChange={onChange} />
        </div>
        { children }
      </div>
    );
  }
}
