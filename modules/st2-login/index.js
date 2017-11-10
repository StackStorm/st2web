import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import api from '@stackstorm/module-api';

import './style.less';

class LoginForm extends React.Component {
  static propTypes = {
    children: PropTypes.node
  }

  render() {
    const { children, ...restProps } = this.props;

    return <form className="st2-login__form" {...restProps}>
      { children }
    </form>;
  }
}

class LoginLogo extends React.Component {
  render() {
    return <a href="#" className="st2-menu__logo"></a>;
  }
}

class LoginError extends React.Component {
  static propTypes = {
    message: PropTypes.string,
  }

  render() {
    return <div className="st2-login__error">
      { this.props.message }
    </div>;
  }
}

class LoginRow extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
  }

  render() {
    const { children, className, ...restProps } = this.props;

    return <div className={cx('st2-login__row', className)} {...restProps}>
      { children }
    </div>;
  }
}

class LoginBottomRow extends React.Component {
  static propTypes = {
    children: PropTypes.node
  }

  render() {
    const { children } = this.props;

    return <div className="st2-login__links">
      { children }
    </div>;
  }
}

export default class Login extends React.Component {
  static propTypes = {
    onConnect: PropTypes.func
  }

  state = {
    redirectToReferrer: false
  }

  connect(e) {
    e.preventDefault();

    // TODO!
    const server = api.servers[this.serverField.value];
    const login = this.loginField.value;
    const password = this.passwordField.value;
    const remember = this.rememberField.checked;

    return api.connect(server, login, password, remember).then(() => {
      return this.props.onConnect();
    });
  }

  render() {
    return <div className="st2-login">
      <LoginForm data-test="login" onSubmit={e => this.connect(e)}>
        <LoginLogo />
        {
          !!this.state.error && <LoginError message={this.state.error} />
        }
        {
          !!api.servers && <LoginRow className="st2-auto-form__select">
            <select className="st2-auto-form__field st2-login__field"
              ref={component => this.serverField = component}
            >
              {
                api.servers.map((server, i) => {
                  return <option key={i} value={i}>
                    { server.auth ? `* ${server.name}` : server.name }
                  </option>;
                })
              }
            </select>
          </LoginRow>
        }
        <LoginRow>
          <input className="st2-auto-form__field st2-login__field"
            ref={component => this.loginField = component}
            type="text"
            name="username"
            placeholder="Username"
            required />
        </LoginRow>
        <LoginRow>
          <input className="st2-auto-form__field st2-login__field"
            ref={component => this.passwordField = component}
            type="password"
            name="password"
            placeholder="Password"
            required />
        </LoginRow>
        <LoginRow>
          <input className="st2-forms__button st2-login__button"
            type="submit"
            value="Connect" />

          <label className="st2-login__checkbox-wrapper">
            <input className="st2-login__checkbox"
              ref={component => this.rememberField = component}
              type="checkbox"
              defaultChecked />
            <span className="st2-login__checkbox-label">
              remember
            </span>
          </label>
        </LoginRow>
        <LoginBottomRow>
          <a target="_blank" href="http://docs.stackstorm.com">
            Documentation
          </a>
          <a href="mailto:support@stackstorm.com" data-reamaze-lightbox="contact">
            Contact Us
          </a>
        </LoginBottomRow>
      </LoginForm>
    </div>;
  }
}
