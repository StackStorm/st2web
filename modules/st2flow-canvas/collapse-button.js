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

export default class CollapseButton extends Component<{
  state: bool,
  position: string,
  onClick: any,
}> {
  static propTypes = {
    state: PropTypes.bool,
    position: PropTypes.string,
    onClick: PropTypes.func.isRequired,
  }

  style = style

  handleClick(e: Event) {
    e.stopPropagation();

    this.props.onClick();
  }

  render() {
    const { position, state } = this.props;

    const { className, icon } = {
      left: {
        className: this.style.left,
        icon: state ? 'icon-chevron_right' : 'icon-chevron_left',
      },
      right: {
        className: this.style.right,
        icon: state ? 'icon-chevron_left' : 'icon-chevron_right',
      },
      top: {
        className: this.style.top,
        icon: state ? 'icon-chevron_down' : 'icon-chevron_up',
      },
    }[position] || {};

    return (
      <div className={cx(this.style.collapseButton, className)} onClick={(e) => this.handleClick(e)}>
        <i className={icon} />
      </div>
    );
  }
}
