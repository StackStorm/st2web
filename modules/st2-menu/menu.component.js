// Copyright 2021 The StackStorm Authors.
// Copyright 2019 Extreme Networks, Inc.
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

import _ from 'lodash';
import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';
import api from '@stackstorm/module-api';

import Link from '@stackstorm/module-router/link.component';

import componentStyle from './style.css';
const APPLICATION_INACTIVITY_TIME = 7200; // 2 hr time here it is in seconds

class Icon extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    style: PropTypes.object,
  }

  static defaultProps = {
    style: componentStyle,
  }

  render() {
    const { style, name } = this.props;

    return (
      <i className={cx(style.icon, name)} />
    );
  }
}

export default class Menu extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    location: PropTypes.shape({
      pathname: PropTypes.string.isRequired,
    }).isRequired,
    routes: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string.isRequired,
      href: PropTypes.string,
      url: PropTypes.string,
      target: PropTypes.string,
      icon: PropTypes.string,
      position: PropTypes.number,
    })).isRequired,
    style: PropTypes.object,
  }

  static defaultProps = {
    style: componentStyle,
  }

  componentDidMount () {
    this.idleLogout();
    window.addEventListener('storage', this.storageChange());

  }
 
  componentWillUnmount() {
    window.removeEventListener('storage',this.storageChange());
  }

  docsLink = 'https://docs.stackstorm.com/'
  supportLink = 'https://github.com/StackStorm/st2/discussions'

  idleLogout() {
    let t;
    window.onload = resetTimer;
    window.onmousemove = resetTimer;
    window.onmousedown = resetTimer;  // catches touchscreen presses as well      
    window.ontouchstart = resetTimer; // catches touchscreen swipes as well 
    window.onclick = resetTimer;      // catches touchpad clicks as well
    window.onkeydown = resetTimer;   
    window.addEventListener('scroll', resetTimer, true); 

    function logoutFunction() {
      // your logout code for too long inactivity goes here
      api.disconnect();
      window.location.reload();
    }

    function resetTimer() {
      window.clearTimeout(t);
      const millisecondTime =  window.st2constants.st2Config.application_inactivity_time * 1000 || APPLICATION_INACTIVITY_TIME * 1000;
      t = window.setTimeout(logoutFunction, millisecondTime);  // time is in milliseconds,application will logout after 2 hr. We can set whatever time we want.
    }
  }

  storageChange () {
    window.addEventListener('storage', (event) => {
      if (event.key === 'logged_in' && (event.oldValue !== event.newValue)) {
        api.disconnect();
        window.location.reload();
      }
    });
  }
  
  handleDisconnect() {
    api.disconnect();
    window.location.reload();
  }

  render() {
    const { className, location, routes: allRoutes, style, ...props } = this.props;

    const routes = _(allRoutes)
      .filter((e) => !!e.icon)
      .sortBy((e) => e.position)
      .value()
    ;

    const user = api.token && api.token.user;
    const server = api.server;
    const showVersion = window.st2constants.st2Config.show_version_in_header || false;
    const hasPackageMeta = (window.st2constants.st2PackageMeta !== undefined);
    const st2webCommitsUrl = (showVersion && hasPackageMeta) ? `https://github.com/StackStorm/st2web/commit/${window.st2constants.st2PackageMeta.git_sha}` : '';

    return (
      <header {...props} className={cx(style.component, className)}>
        <a href="#" className={style.logo} /> { (showVersion && hasPackageMeta) ? <span style={{ fontSize: 15, marginTop: 30 }}>st2: v{window.st2constants.st2PackageMeta.version}, st2web: <a href={st2webCommitsUrl} target="_blank" rel="noopener noreferrer">{window.st2constants.st2PackageMeta.git_sha}</a></span> : '' }

        <div className={style.spacer} />

        { (this.props.location.pathname).match('^/action') !== null && (this.props.location.pathname).match('^/actions') == null ? '' : (
          <div className={style.nav}>
            { _.map(routes, ({ title, href, url, target, icon }) => {
              if (href) {
                return (
                  <a
                    key={title}
                    className={style.navItem}
                    href={href}
                    target={target}
                  >
                    <Icon name={icon} style={style} />
                    { title }
                  </a>
                );
              }

              if (url) {
                return (
                  <Link
                    key={title}
                    className={cx(style.navItem, location.pathname.indexOf(url) === 0 && style.navItemActive)}
                    to={url}
                    target={target}
                  >
                    <Icon name={icon} style={style} />
                    { title }
                  </Link>
                );
              }

              return null;
            }) }
          </div>
        )}
        <div className={style.spacer} />

        <div className={style.side}>
          <label className={style.sideItem}>
            { user || 'Stanley' }@{ server.name }
            <i className={cx(style.icon, 'icon-user')} />
            <input type="checkbox" />
            <div className={style.sideDropdown}>
              <div className={style.sideDropdownBackdrop} />
              <div
                className={style.sideDropdownItem}
                onClick={() => this.handleDisconnect()}
              >
                Sign out
              </div>
            </div>
          </label>
        </div>

        <a target="_blank" rel="noopener noreferrer" href={this.docsLink} className={style.side}>
          Docs
        </a>

        <a target="_blank" rel="noopener noreferrer" href={this.supportLink} className={style.side}>
          Support
        </a>
      </header>
    );
  }
}
