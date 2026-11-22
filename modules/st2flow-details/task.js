// Copyright 2021 The StackStorm Authors.
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

import { Component } from 'react';
import cx from 'classnames';

import style from './style.module.css';

export default class Task extends Component {
  style = style;

  handleClick = (e) => {
    const { onClick } = this.props;

    if (!onClick) {
      return;
    }

    e.stopPropagation();

    onClick(e);
  };

  handleDoubleClick = (e) => {
    const { onDoubleClick } = this.props;

    if (!onDoubleClick) {
      return;
    }

    e.stopPropagation();

    onDoubleClick(e);
  };

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
