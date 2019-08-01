// Copyright 2019 Extreme Networks, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
