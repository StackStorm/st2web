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
    onConnect;

    return (
      <div {...props} className={cx(style.component, className)}>
        <LoginForm data-test="login" onSubmit={(e) => this.connect(e)} style={style} >
          <LoginLogo style={style} />

          { this.state.error ? (
            <LoginError message={this.state.error} style={style} />
          ) : null }

          { this.state.servers && this.state.servers.length > 1 ? (
            <LoginRow className={cx('st2-auto-form__select')} style={style} >
              <select
                className={cx('st2-auto-form__field', style.field)}
                value={JSON.stringify(this.state.server)}
                onChange={({ target: { value } }) => this.setState({ server: JSON.parse(value) })}
              >
                { this.state.servers.map((server) => {
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

          <LoginRow style={style} >
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
          <LoginRow style={style} >
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
          <LoginRow style={style} >
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

          <LoginBottomRow style={style} >
            <a target="_blank" rel="noopener noreferrer" href={this.docsLink}>
              Documentation
            </a>
            <a target="_blank" rel="noopener noreferrer" href={this.supportLink}>
              Support
            </a>
          </LoginBottomRow>
        </LoginForm>
      </div>
    );
  }
}
