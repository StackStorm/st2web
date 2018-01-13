import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import './style.less';

const states = {
  'complete': {
    className: 'st2-label--success',
  },
  'error': {
    className: 'st2-label--danger',
  },
  'enabled': {
    className: 'st2-label--success',
  },
  'disabled': {
    className: 'st2-label--danger',
  },
  'succeeded': {
    className: 'st2-label--succeeded',
  },
  'failed': {
    className: 'st2-label--failed',
  },
  'running': {
    className: 'st2-label--progress',
  },
  'scheduled': {
    className: 'st2-label--progress',
  },
  'canceling': {
    className: 'st2-label--warning',
  },
  'canceled': {
    className: 'st2-label--warning',
  },
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
        <span {...props} className={cx('st2-label--short', className, state && state.className)}>
          <span className="st2-label__label">
            { capitalize(state && state.title || status) }
          </span>
        </span>
      );
    }

    return (
      <span {...props} className={cx('st2-label', className, state && state.className)}>
        { capitalize(state && state.title || status) }
      </span>
    );
  }
}
