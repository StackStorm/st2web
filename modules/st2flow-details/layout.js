// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

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
