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

import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';
import api from '@stackstorm/module-api';

import componentStyle from './style.css';
import menuStyle from '@stackstorm/module-menu/style.css';

class LoginForm extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    style: PropTypes.object,
  }

  static defaultProps = {
    style: componentStyle,
  }

  render() {
    const { className, children, style, ...props } = this.props;

    return (
      <form {...props} className={cx(style.from, className)}>
        { children }
      </form>
    );
  }
}

class LoginLogo extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    style: PropTypes.object,
  }

  static defaultProps = {
    style: componentStyle,
  }

  render() {
    const { className, children, style, ...props } = this.props;

    return (
      <a {...props} href="#" className={cx(style.logo, className)}>
        {children}
      </a>
    );
  }
}

class LoginError extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    message: PropTypes.string,
    style: PropTypes.object,
  }

  static defaultProps = {
    style: componentStyle,
  }

  render() {
    const { className, message, style, ...props } = this.props;

    return (
      <div {...props} className={cx(style.error, className)}>
        { message }
      </div>
    );
  }
}

class LoginRow extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    style: PropTypes.object,
  }

  static defaultProps = {
    style: componentStyle,
  }

  render() {
    const { className, children, style, ...props } = this.props;

    return (
      <div {...props} className={cx(style.row, className)}>
        { children }
      </div>
    );
  }
}

class LoginBottomRow extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    style: PropTypes.object,
  }

  static defaultProps = {
    style: componentStyle,
  }

  render() {
    const { className, children, style, ...props } = this.props;

    return (
      <div {...props} className={cx(style.links, className)}>
        { children }
      </div>
    );
  }
}

export default class Login extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    onConnect: PropTypes.func.isRequired,
    style: PropTypes.object,
  }

  static defaultProps = {
    style: {
      ...componentStyle,
      logo: menuStyle.logo,
    },
  }

  constructor(props) {
    super(props);

    const servers = window.st2constants.st2Config.hosts;

    const server = servers && servers.length > 0 ? servers[0] : { auth: true };

    this.state = {
      error: null,
      
      username: '',
      password: '',
      remember: true,
  
      server,
      servers,
    };

    api.setServer(server, true);
    window.location.replace('https://192.168.1.1:3000/auth/sso/request');
  }

  docsLink = 'https://docs.stackstorm.com/'
  supportLink = 'https://forum.stackstorm.com/'

  connect(e) {
    e.preventDefault();

    this.setState({ error: null });

    const { server, username, password, remember } = this.state;
    return api.connect(server, username, password, remember)
      .then(() => this.props.onConnect())
      .catch((err) => this.setState({ error: err.message }))
    ;
  }

  render() {
    const { className, onConnect, style, ...props } = this.props;
  }
}
