import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';
import api from '@stackstorm/module-api';

import style from './style.less';
import menuStyle from '@stackstorm/module-menu/style.less';

class LoginForm extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, children, ...props } = this.props;

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
  }

  render() {
    const { className, children, ...props } = this.props;

    return (
      <a {...props} href="#" className={cx(menuStyle.logo, className)}>
        {children}
      </a>
    );
  }
}

class LoginError extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    message: PropTypes.string,
  }

  render() {
    const { className, message, ...props } = this.props;

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
  }

  render() {
    const { className, children, ...props } = this.props;

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
  }

  render() {
    const { className, children, ...props } = this.props;

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
    };
  }

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
    const { className, onConnect, ...props } = this.props;
    onConnect;

    return (
      <div {...props} className={cx(style.component, className)}>
        <LoginForm data-test="login" onSubmit={(e) => this.connect(e)}>
          <LoginLogo />

          { this.state.error ? (
            <LoginError message={this.state.error} />
          ) : null }

          { api.servers && api.servers.length > 1 ? (
            <LoginRow className={cx('st2-auto-form__select')}>
              <select
                className={cx('st2-auto-form__field', style.field)}
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
              className={cx('st2-auto-form__field', style.field)}
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
              className={cx('st2-auto-form__field', style.field)}
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
              className={cx('st2-forms__button', style.button)}
              type="submit"
              value="Connect"
            />

            <label className={style.checkboxWrapper}>
              <input
                className={style.checkbox}
                type="checkbox"
                checked={this.state.remember}
                onChange={({ target: { checked: remember } }) => this.setState({ remember })}
              />
              <span className={style.checkboxLabel}>
                remember
              </span>
            </label>
          </LoginRow>

          <LoginBottomRow>
            <a target="_blank" rel="noopener noreferrer" href="https://docs.stackstorm.com">
              Documentation
            </a>
            <a target="_blank" rel="noopener noreferrer" href="https://forum.stackstorm.com/">
              Support
            </a>
          </LoginBottomRow>
        </LoginForm>
      </div>
    );
  }
}
