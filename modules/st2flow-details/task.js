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
