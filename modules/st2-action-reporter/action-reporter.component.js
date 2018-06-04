import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import reporters from './reporters';

import style from './style.less';

export default class ActionReporter extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    runner: PropTypes.string.isRequired,
    execution: PropTypes.object.isRequired,
  }

  render() {
    const { className, runner, execution, ...props } = this.props;
    const reporter = reporters[runner] || reporters.debug;

    if (!execution) {
      return null;
    }

    return (
      <div {...props} className={cx(style.component, className)}>
        { reporter(execution) }
      </div>
    );
  }
}
