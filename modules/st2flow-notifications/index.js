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

class Notification extends Component {
  state = {
    hide: false,
  };

  handleRemove = (e) => {
    e.stopPropagation();

    this.setState({ hide: true });
  };

  style = style;

  redirectLinkToParent = (e,newlink) => {
    e.preventDefault();
    const goBack = window.open(newlink, 'parent');
    goBack.focus();
  };

  render() {
    const { notification } = this.props;
    const { hide } = this.state;

    return !hide && (
      <div className={cx(this.style.notification, this.style[notification.type])}>
        <button className={cx(style.notification, style.close)} aria-label="Close" onClick={this.handleRemove}>
          <span aria-hidden="true">&times;</span>
        </button>
        { notification.message }
        { notification.link && (
          <a href={notification.link} onClick={e => this.redirectLinkToParent(e,notification.link)}>
            {notification.link}
          </a>

        ) }
      </div>
    );
  }
}

class Notifications extends Component {
  static defaultProps = {
    position: 'top',
  };

  render() {
    return (
      <div className={cx(this.props.className, style.component, style[this.props.position])}>
        {this.props.notifications.map(notif => <Notification key={notif.id} notification={notif} />)}
      </div>
    );
  }
}

export default Notifications;
