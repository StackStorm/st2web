// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

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
    return (
      <div className={this.style.action} ref={this.actionRef} draggable>
        <div className={this.style.actionName}>{ action.ref }</div>
        <div className={this.style.actionDescription}>{ action.description }</div>
      </div>
    );
  }
}
