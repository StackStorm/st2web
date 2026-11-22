// Copyright 2021 The StackStorm Authors.
// Copyright 2020 Extreme Networks, Inc.
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

import { Component } from 'react';
import { connect } from 'react-redux';

import { Panel, Toolbar } from './layout';

import Task from './task';

import style from './style.module.css';

class TaskList extends Component {
  style = style;

  render() {
    const { tasks, navigate } = this.props;

    return ([
      <Toolbar key="toolbar" secondary={true}>
        <h4 className={this.style.taskListTitle}>Workflow Tasks</h4>
      </Toolbar>,
      <Panel key="panel" className={this.style.taskPanel}>
        {
          tasks.map(task => (
            <Task
              key={task.name}
              task={task}
              onClick={() => navigate({ task: task.name })}
            />
          ))
        }
      </Panel>,
    ]);
  }
}

export default connect(
  ({ flow: { tasks }}) => ({ tasks }),
  (dispatch) => ({
    navigate: (navigation) => dispatch({
      type: 'CHANGE_NAVIGATION',
      navigation,
    }),
  })
)(TaskList);
