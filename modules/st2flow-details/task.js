// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

//@flow

import type { TaskInterface } from '@stackstorm/st2flow-model/interfaces';

import React, { Component } from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import style from './style.css';

export default class Task extends Component<{
  task: TaskInterface,
  onClick?: Function,
  onDoubleClick?: Function,
}> {
  static propTypes = {
    task: PropTypes.object.isRequired,
    onClick: PropTypes.func,
  }

  style = style

  handleClick = (e: Event) => {
    const { onClick } = this.props;

    if (!onClick) {
      return;
    }

    e.stopPropagation();

    onClick(e);
  }

  handleDoubleClick = (e: Event) => {
    const { onDoubleClick } = this.props;

    if (!onDoubleClick) {
      return;
    }

    e.stopPropagation();

    onDoubleClick(e);
  }

  render() {
    const { task } = this.props;

    return (
      <div
        key={task.name}
        className={this.style.task}
        onClick={this.handleClick}
        onDoubleClick={this.handleDoubleClick}
      >
        <div className={this.style.taskInfo}>
          <div className={this.style.taskName}>{ task.name }</div>
          <div className={this.style.taskAction}>{ task.action }</div>
        </div>
        <i className={cx('icon-chevron_right', this.style.taskArrow)} />
      </div>
    );
  }
}
