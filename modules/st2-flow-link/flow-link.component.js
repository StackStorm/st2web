import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';
import api from '@stackstorm/module-api';

import style from './style.css';

export default class FlowLink extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    action: PropTypes.string,
  }

  get token() {
    return btoa(JSON.stringify({
      api: api.server.api,
      auth: api.server.auth,
      token: api.token,
    })).replace(/=/g, '');
  }

  render() {
    if (!this.getUrlProps) {
      return false;
    }

    const { className, action, ...props } = this.props;

    return (
      <div {...props} className={cx(style.component, className)}>
        { action ? (
          <a
            className="st2-forms__button st2-details__toolbar-button"
            {...this.getUrlProps(action)}
          >
            Edit
          </a>
        ) : (
          <a className="st2-panel__toolbar-button" {...this.getUrlProps()} >
            <i className="icon-plus" />
          </a>
        ) }
      </div>
    );
  }
}
