// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

//@flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { PropTypes } from 'prop-types';

import { Panel, Toolbar } from './layout';

import Task from './task';

import style from './style.css';

@connect(
  ({ flow: { tasks }}) => ({ tasks }),
  (dispatch) => ({
    navigate: (navigation) => dispatch({
      type: 'CHANGE_NAVIGATION',
      navigation,
    }),
  })
)
export default class TaskList extends Component<{
  tasks: Array<Object>,

  navigate: Function,
}> {
  static propTypes = {
    tasks: PropTypes.array,

    navigate: PropTypes.func,
  }

  style = style

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
