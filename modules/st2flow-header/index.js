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
import cx from 'classnames';
import url from 'url';

import api from '@stackstorm/module-api';

import style from './style.css';

export default class Header extends Component<{
  className?: string,
}, {
  showDropdown: bool,
}> {
  static propTypes = {
    className: PropTypes.string,
  }

  state = {
    showDropdown: false,
  }

  style = style

  handleToggleDropdown(e: Event) {
    e.stopPropagation();

    const { showDropdown } = this.state;

    this.setState({ showDropdown: !showDropdown });
  }

  handleLogout(e: Event) {
    e.stopPropagation();

    api.disconnect();
    window.location.reload();
  }

  render() {
    const { showDropdown } = this.state;

    return (
      <div className={cx(this.props.className, this.style.component)}>
        <div className={this.style.logo}><img src="static/logo-extreme.svg" width="101" height="25" /></div>
        <div className={this.style.subtitle}>Workflow Designer</div>
        <div className={this.style.separator} />
        {
          api.token && api.server && (
            <div className={this.style.user} onClick={e => this.handleToggleDropdown(e)} >
              { api.token.user }@{ url.parse(api.server.api).host }
              <i className={cx('icon-user', this.style.icon)} />
              { showDropdown && (
                <div className={this.style.dropdown}>
                  <div className={this.style.dropdownBackdrop} onClick={e => this.handleToggleDropdown(e)} />
                  <div className={this.style.dropdownItem} onClick={e => this.handleLogout(e)}>logout</div>
                </div>
              )}
            </div>
          )
        }
      </div>
    );
  }
}
