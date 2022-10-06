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

//@flow

import React, { Component } from 'react';
import { PropTypes } from 'prop-types';

import style from './style.css';

export default class Action extends Component<{
  action: Object
}> {
  static propTypes = {
    action: PropTypes.object.isRequired,
  }

  componentDidMount() {
    this.handleDragStart = this.handleDragStart.bind(this);

    const el = this.actionRef.current;
    if (!el) {
      return;
    }
    el.addEventListener('dragstart', this.handleDragStart);
  }

  componentWillUnmount() {
    const el = this.actionRef.current;
    if (!el) {
      return;
    }
    el.removeEventListener('dragstart', this.handleDragStart);
  }

  handleDragStart = (e: DragEvent) => {
    this.style.opacity = '0.4';

    const { action } = this.props;

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('application/json', JSON.stringify({
        action,
        handle: {
          x: e.offsetX,
          y: e.offsetY,
        },
      }));
    }
  }

  style = style
  actionRef = React.createRef();

  render() {
    const { action } = this.props;

    const href = `${location.origin}/#/action/${action.ref}`;

    const supportedRunnerTypes = {
      'orquesta': href,
      'mistral-v2': href
    };

    return (
      <div
        draggable
        className={this.style.action}
        ref={this.actionRef}
        href={supportedRunnerTypes[action.runner_type]}
        target="_blank"
        rel="noopener noreferrer">
        <div className={this.style.actionName}>{ action.ref }</div>
        <div className={this.style.actionDescription}>{ action.description }</div>
      </div>
    );
  }
}
