import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import api from '@stackstorm/module-api';

import './style.less';

class LoginForm extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  }

  render() {
    const { children, ...restProps } = this.props;

    return (
      <form className="st2-login__form" {...restProps}>
        { children }
      </form>
    );
  }
}

class LoginLogo extends React.Component {
  render() {
    return (
      <a href="#" className="st2-menu__logo" />
    );
  }
}

class LoginError extends React.Component {
  static propTypes = {
    message: PropTypes.string,
  }

  render() {
    return (
      <div className="st2-login__error">
        { this.props.message }
      </div>
    );
  }
}

class LoginRow extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
  }

  render() {
    const { children, className, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-login__row', className)}>
        { children }
      </div>
    );
  }
}

class LoginBottomRow extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  }

  render() {
    const { children } = this.props;

    return (
      <div className="st2-login__links">
        { children }
      </div>
    );
  }
}

export default class Login extends React.Component {
  static propTypes = {
    onConnect: PropTypes.func,
  }

  state = {
    error: null,
    username: '',
    password: '',
    remember: true,

    server: null,
  }

  componentWillMount() {
    let server = { auth: true };
    if (api.servers && api.servers.length > 0) {
      server = api.servers[0];
    }

    this.setState({
      server,
    });
  }

  connect(e) {
    e.preventDefault();

    const { server, username, password, remember } = this.state;
    return api.connect(server, username, password, remember)
      .then(() => this.props.onConnect())
    ;
  }

  render() {
    return (
      <div className="st2-login">
        <LoginForm data-test="login" onSubmit={(e) => this.connect(e)}>
          <LoginLogo />

          { this.state.error ? (
            <LoginError message={this.state.error} />
          ) : null }

          { api.servers && api.servers.length > 1 ? (
            <LoginRow className="st2-auto-form__select">
              <select
                className="st2-auto-form__field st2-login__field"
                value={JSON.stringify(this.state.server)}
                onChange={({ target: { value } }) => this.setState({ server: JSON.parse(value) })}
              >
                { api.servers.map((server) => {
                  const stringified = JSON.stringify(server);

                  return (
                    <option key={stringified} value={stringified}>
                      { server.auth ? `* ${server.name}` : server.name }
                    </option>
                  );
                }) }
              </select>
            </LoginRow>
          ) : null }

          <LoginRow>
            <input
              className="st2-auto-form__field st2-login__field"
              type="text"
              name="username"
              placeholder="Username"
              required
              value={this.state.username}
              onChange={({ target: { value: username } }) => this.setState({ username })}
            />
          </LoginRow>
          <LoginRow>
            <input
              className="st2-auto-form__field st2-login__field"
              type="password"
              name="password"
              placeholder="Password"
              required
              value={this.state.password}
              onChange={({ target: { value: password } }) => this.setState({ password })}
            />
          </LoginRow>
          <LoginRow>
            <input
              className="st2-forms__button st2-login__button"
              type="submit"
              value="Connect"
            />

            <label className="st2-login__checkbox-wrapper">
              <input
                className="st2-login__checkbox"
                type="checkbox"
                checked={this.state.remember}
                onChange={({ target: { checked: remember } }) => this.setState({ remember })}
              />
              <span className="st2-login__checkbox-label">
                remember
              </span>
            </label>
          </LoginRow>

          <LoginBottomRow>
            <a target="_blank" rel="noopener noreferrer" href="http://docs.stackstorm.com">
              Documentation
            </a>
            <a href="mailto:support@stackstorm.com" data-reamaze-lightbox="contact">
              Contact Us
            </a>
          </LoginBottomRow>
        </LoginForm>
      </div>
    );
  }
}
