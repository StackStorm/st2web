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
