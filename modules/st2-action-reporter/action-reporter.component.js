import React from 'react';
import { PropTypes } from 'prop-types';

import cx from 'classnames';
import reporters from './reporters';

import './style.less';

export default class ActionReporter extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    runner: PropTypes.string,
    execution: PropTypes.object,
  }

  render() {
    const { className, runner, execution, ...props } = this.props;
    const reporter = reporters[runner] || reporters.debug;

    if (!execution) {
      return null;
    }

    return (
      <div {...props} className={cx('st2-action-reporter', className)}>
        { reporter(execution) }
      </div>
    );
  }
}
