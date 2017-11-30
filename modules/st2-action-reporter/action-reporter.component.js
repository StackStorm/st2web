import React from 'react';
import { PropTypes } from 'prop-types';

import reporters from './reporters';

import './style.less';

export default class ActionReporter extends React.Component {
  static propTypes = {
    runner: PropTypes.string,
    execution: PropTypes.object,
  }

  render() {
    const { runner, execution } = this.props;
    const reporter = reporters[runner] || reporters.debug;

    if (!execution) {
      return null;
    }

    return (
      <div className="st2-action-reporter">
        { reporter(execution) }
      </div>
    );
  }
}
