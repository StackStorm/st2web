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
import cx from 'classnames';

import style from './style.css';

export class Toolbar extends Component<{
  secondary?: bool,
  children?: Node,
}> {
  static propTypes = {
    secondary: PropTypes.bool,
    children: PropTypes.node,
  }

  style = style

  render() {
    const { secondary } = this.props;
    return (
      <div className={cx(this.style.toolbar, secondary && this.style.secondary)} >
        { this.props.children }
      </div>
    );
  }
}

export class ToolbarButton extends Component<{
  className?: string,
  children?: Node,
  stretch?: bool,
  selected?: bool,
}> {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    stretch: PropTypes.bool,
    selected: PropTypes.bool,
  }

  style = style

  render() {
    const { className, stretch, selected, ...props } = this.props;
    return (
      <div className={cx(this.style.toolbarButton, className, stretch && this.style.stretch, selected && this.style.selected)} {...props} >
        { this.props.children }
      </div>
    );
  }
}

export class Panel extends Component<{
  className?: string,
  children?: Node,
}> {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
  }

  style = style

  render() {
    const { className } = this.props;
    return (
      <div className={cx(this.style.panel, className)} >
        { this.props.children }
      </div>
    );
  }
}
