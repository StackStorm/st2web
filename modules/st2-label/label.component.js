import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import style from './style.css';

const states = {
  'enabled': style.success,
  'disabled': style.danger,
  'scheduled': style.progress,
  'running': style.progress,
  'complete': style.success,
  'succeeded': style.succeeded,
  'failed': style.failed,
  'error': style.danger,
  'canceling': style.warning,
  'canceled': style.warning,
  'timeout': style.warning,
};

function capitalize(string) {
  if (!string || !string.charAt) {
    return string;
  }
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

export default class Label extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    status: PropTypes.string.isRequired,
    short: PropTypes.bool.isRequired,
  }

  static defaultProps = {
    short: false,
  }

  render() {
    const { className, status, short, ...props } = this.props;

    const state = states[status];

    if (short) {
      return (
        <span className={cx(style.component, style.short)}>
          <span {...props} className={cx(style.label, className, state)}>
            { capitalize(status) }
          </span>
        </span>
      );
    }

    return (
      <span className={cx(style.component)}>
        <span {...props} className={cx(style.label, className, state)}>
          { capitalize(status) }
        </span>
      </span>
    );
  }
}
