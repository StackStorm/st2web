import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';
import api from '@stackstorm/module-api';

import './style.less';

export default class Filter extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    action: PropTypes.string,
  }

  get token() {
    return btoa(JSON.stringify({
      api: api.server.url,
      auth: api.server.auth,
      token: api.token,
    })).replace(/=/g, '');
  }

  get url() {
    return api.server.flow || window.st2constants.st2Config.flow;
  }

  get target() {
    const { action } = this.props;

    return action ? `st2flow+${api.opts.api}+${action}` : `st2flow+${api.opts.api}`;
  }

  render() {
    const { className, action, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-flow-link', className)}>
        { action ? (
          <a
            className="st2-forms__button st2-forms__button--small st2-details__toolbar-button"
            href={`${this.url}/#/import/${this.token}/${action}`}
            target={this.target}
          >
            Edit
          </a>
        ) : (
          <a
            className="st2-panel__toolbar-button"
            href={`${this.url}/#/import/${this.token}`}
            target={this.target}
          >
            <i className="icon-plus" />
          </a>
        ) }
      </div>
    );
  }
}
