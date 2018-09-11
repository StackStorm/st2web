import React from 'react';
import { PropTypes } from 'prop-types';

import ActionCode from './panels/action-code.component';
import ActionEntrypoint from './panels/action-entrypoint.component';
import ExecutionCode from './panels/execution-code.component';
import ExecutionResult from './panels/execution-result.component';
import TriggerInstanceCode from './panels/trigger-instance-code.component';
import LiveFeed from './panels/execution-live-feed.component';
import RuleCode from './panels/rule-code.component';
import TriggerTypeCode from './panels/trigger-type-code.component';
import UnknownCode from './panels/unknown.component';

export default class CodePanel extends React.Component {
  static propTypes = {
    type: PropTypes.string,
  }

  render() {
    const { type } = this.props;
    switch (type) {
      case 'action':
        return <ActionCode {...this.props} />;
      case 'entrypoint':
        return <ActionEntrypoint {...this.props} />;
      case 'execution':
        return <ExecutionCode {...this.props} />;
      case 'result':
        return <ExecutionResult {...this.props} />;
      case 'live':
        return <LiveFeed {...this.props} />;
      case 'rule':
        return <RuleCode {...this.props} />;
      case 'trigger_type':
        return <TriggerTypeCode {...this.props} />;
      case 'trigger_instance':
        return <TriggerInstanceCode {...this.props} />;
      default:
        return <UnknownCode {...this.props} />;
    }
  }
}
