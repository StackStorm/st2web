import _ from 'lodash';
import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';
import api from '@stackstorm/module-api';

import { Link } from 'react-router-dom';

import style from './style.less';

class Icon extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
  }

  render() {
    return (
      <i className={cx(style.icon, this.props.name)} />
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
  }

  docsLink = 'https://docs.stackstorm.com/'
  supportLink = 'https://forum.stackstorm.com/'

  handleDisconnect() {
    api.disconnect();
    window.location.reload();
  }

  render() {
    const { className, location, routes: allRoutes, ...props } = this.props;

    const routes = _(allRoutes)
      .filter((e) => !!e.icon)
      .sortBy((e) => e.position)
      .value()
    ;

    const user = api.token && api.token.user;
    const server = api.server;

    return (
      <header {...props} className={cx(style.component, className)}>
        <a href="#" className={style.logo} />

        <div className={style.spacer} />

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
                  <Icon name={icon} />
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
                  <Icon name={icon} />
                  { title }
                </Link>
              );
            }

            return null;
          }) }
        </div>

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
