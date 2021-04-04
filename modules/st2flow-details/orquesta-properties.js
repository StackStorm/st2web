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

//@flow

import type { TaskInterface } from '@stackstorm/st2flow-model/interfaces';

import React, { Component } from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import cx from 'classnames';

import { StringField } from '@stackstorm/module-auto-form/fields';

import Property from './property';

import style from './style.css';

type TransitionProps = {
  task: TaskInterface,
  issueModelCommand?: Function,
};

@connect(
  null,
  (dispatch) => ({
    issueModelCommand: (command, ...args) => {
      dispatch({
        type: 'MODEL_ISSUE_COMMAND',
        command,
        args,
      });
    },
  })
)
export default class OrquestaTransition extends Component<TransitionProps, {}> {
  static propTypes = {
    task: PropTypes.object.isRequired,
    issueModelCommand: PropTypes.func,
  }

  handleTaskProperty(name: string | Array<string>, value: any, noDelete: boolean = false) {
    const { task, issueModelCommand } = this.props;

    if (value || noDelete) {
      issueModelCommand && issueModelCommand('setTaskProperty', task, name, value);
    }
    else {
      issueModelCommand && issueModelCommand('deleteTaskProperty', task, name);
    }
  }

  getValue(value) {
    if (!isNaN(value) && value !== '') {
      value = parseInt(value,10);
    }

    return value;
  }

  style = style
  joinFieldRef = React.createRef();

  render() {
    const { task } = this.props;

    return [
      <Property
        key="join"
        name="Join"
        description="Allows to synchronize multiple parallel workflow branches and aggregate their data."
        value={task.join != null}
        onChange={value => this.handleTaskProperty('join', value ? 'all' : false)}
      >
        {
          task.join != null && (
            <div className={cx(this.style.propertyChild, this.style.radioGroup)}>
              <div className={cx(this.style.radio, task.join === 'all' && this.style.checked)} onClick={() => this.handleTaskProperty('join', 'all')}>
                Join all tasks
              </div>
              <label htmlFor="joinField" className={cx(this.style.radio, task.join !== 'all' && this.style.checked)} onClick={(e) => this.handleTaskProperty('join', parseInt((this.joinFieldRef.current || {}).value, 10))} >
                Join
                <input
                  type="text"
                  id="joinField"
                  size="3"
                  className={this.style.radioField}
                  ref={this.joinFieldRef}
                  value={isNaN(task.join) ? 10 : task.join}
                  onChange={e => this.handleTaskProperty('join', parseInt(e.target.value, 10) || 0, true)}
                  onBlur={e => this.handleTaskProperty('join', parseInt(e.target.value, 10))}
                />
                tasks
              </label>
            </div>
          )
        }
      </Property>,
      <Property key="with" name="With Items" description="Run an action or workflow associated with a task multiple times." value={!!task.with} onChange={value => this.handleTaskProperty('with', value ? { items: 'x in <% ctx(y) %>' } : false)}>
        {
          task.with && (
            <div className={this.style.propertyChild}>
              <StringField name="items" value={task.with.items} onChange={value => this.handleTaskProperty([ 'with', 'items' ], value)} />
              <StringField name="concurrency" value={task.with.concurrency} onChange={value => this.handleTaskProperty([ 'with', 'concurrency' ], value)} />
            </div>
          )
        }
      </Property>,
      <Property key="delay" name="Delay" description="Add delay before task execution" value={task.delay != null} onChange={value => this.handleTaskProperty('delay', value ? '10' : false)}>
        {
          task.delay != null && (
            <div className={this.style.propertyChild}>
              <label htmlFor="delay" >
                delay (seconds)
                <input
                  type="text"
                  id="delayField"
                  size="3"
                  className={this.style.delayField}
                  value={(task.delay)}
                  placeholder="enter expression or integer"
                  onChange={e => this.handleTaskProperty('delay',this.getValue(e.target.value), true)}
                  onBlur={e => this.handleTaskProperty('delay',this.getValue(e.target.value), true)} 
                />
              </label>
            </div>
          )
        }
      </Property>,
      <Property key="retry" name="Retry" description="Define the retry condition for the task execution." value={!!task.retry} onChange={value => this.handleTaskProperty('retry', value ? { when: '<% failed() %>' } : false)}>
        {
          task.retry && (
            <div className={this.style.propertyChild}>
              <StringField name="when" value={task.retry.when} className="when-title" onChange={value => this.handleTaskProperty([ 'retry', 'when' ], value)} spec={{'default':'enter expression'}}  />
              <StringField name="count" value={task.retry.count} className="count-title" onChange={value => this.handleTaskProperty([ 'retry', 'count' ], this.getValue(value))}  spec={{'default':'enter expression or integer'}} />
              <StringField name="delay (seconds)" value={task.retry.delay} className="delay-title" onChange={value => this.handleTaskProperty([ 'retry', 'delay' ], this.getValue(value))} spec={{'default':'enter expression or integer'}} />
            </div>
          )
        }
      </Property>,
    ];
  }
}
