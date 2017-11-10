import _ from 'lodash';
import React from 'react';
import { PropTypes } from 'prop-types';
import { Link } from 'react-router-dom';

import api from '@stackstorm/module-api';

import './style.less';

class Icon extends React.Component {
  static propTypes = {
    name: PropTypes.string
  }

  render() {
    return <i className={`st2-menu__icon ${this.props.name}`} />;
  }
}

export default class Menu extends React.Component {
  static propTypes = {
    location: PropTypes.object,
    routes: PropTypes.array
  }

  handleDisconnect() {
    api.disconnect();
    window.location.reload();
  }

  render() {
    const { location } = this.props;

    const routes = _(this.props.routes)
      .filter(e => !!e.icon)
      .sortBy(e => e.position)
      .value()
      ;

    const user = api.token.user;
    const server = api.server;

    return <header className="st2-menu">
      <a href="#" className="st2-menu__logo"></a>

      <div className="st2-menu__spacer"></div>

      <div className="st2-menu__nav">
        {
          _.map(routes, route => {
            const props = {
              key: route.title,
              className: 'st2-menu__nav-item',
              target: route.target,
            };

            if (route.href) {
              return <a href={route.href} {...props}>
                <Icon name={route.icon} />
                { route.title }
              </a>;
            }

            if (location.pathname.indexOf(route.url) === 0) {
              props.className += ' st2-menu__nav-item--active';
            }

            return <Link to={route.url} {...props}>
              <Icon name={route.icon} />
              { route.title }
            </Link>;
          })
        }
      </div>

      <div className="st2-menu__spacer"></div>

      <div className="st2-menu__user">
        <label className="st2-menu__user-item">
          { user || 'Stanley' }@{ server.name }
          <i className="st2-menu__icon icon-user"></i>
          <input type="checkbox"/>
          <div className="st2-menu__user-dropdown">
            <div className="st2-menu__user-dropdown-backdrop"></div>
            <div className="st2-menu__user-dropdown-item"
              onClick={() => this.handleDisconnect()}>
              Sign out
            </div>
          </div>
        </label>
      </div>

      <a href="mailto:support@stackstorm.com" className="st2-menu__nav-item" data-reamaze-lightbox="contact">
        <i className="st2-menu__icon icon-question"></i>
        Contact us
      </a>
    </header>;
  }
}
