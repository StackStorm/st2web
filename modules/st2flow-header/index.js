// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

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
