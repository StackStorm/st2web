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

import { StringField, ObjectField } from '@stackstorm/module-auto-form/fields';

import Property from './property';

import style from './style.css';

type MistralTaskInterface = {
  ...TaskInterface,
  'with-items': string,
  join: string,
  concurrency: number | string,
  'pause-before': number | string,
  'wait-before': number | string,
  'wait-after': number | string,
  timeout: number | string,
  retry: {
    count: number | string,
    delay: number | string,
    'continue-on': string,
    'break-on': string,
  },
  publish: Object,
  'publish-on-error': Object,
}

type TransitionProps = {
  task: MistralTaskInterface,
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
export default class MistralProperties extends Component<TransitionProps, {}> {
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


  style = style
  joinFieldRef = React.createRef();

  render() {
    const { task } = this.props;

    return [
      <Property key="join" name="Join" description="Allows to synchronize multiple parallel workflow branches and aggregate their data."  value={task.join != null} onChange={value => this.handleTaskProperty('join', value !== false ? 'all' : undefined)}>
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
      <Property key="with" name="With Items" description="Run an action or workflow associated with a task multiple times." value={!!task['with-items']} onChange={value => this.handleTaskProperty('with-items', value !== false ? 'x in <% ctx(y) %>' : undefined)}>
        {
          task['with-items'] !== undefined && (
            <div className={this.style.propertyChild}>
              <StringField value={task['with-items']} onChange={value => value !== undefined && this.handleTaskProperty('with-items', value)} />
            </div>
          )
        }
      </Property>,
      <Property key="concurrency" name="Concurrency" description="Defines a max number of actions running simultaneously in a task." value={task.concurrency !== undefined} onChange={value => this.handleTaskProperty('concurrency', value !== false ? 1 : undefined)}>
        {
          task.concurrency !== undefined && (
            <div className={this.style.propertyChild}>
              <StringField value={task.concurrency.toString()} onChange={value => value !== undefined && this.handleTaskProperty('concurrency', value)} />
            </div>
          )
        }
      </Property>,
      <Property key="pausebefore" name="Pause Before" description="Defines whether Mistral Engine should put the workflow on hold or not before starting a task." value={task['pause-before'] !== undefined} onChange={value => this.handleTaskProperty('pause-before', value !== false ? true : undefined)}>
        {
          task['pause-before'] !== undefined && (
            <div className={this.style.propertyChild}>
              <StringField value={task['pause-before'].toString()} onChange={value => value !== undefined && this.handleTaskProperty('pause-before', value)} />
            </div>
          )
        }
      </Property>,
      <Property key="waitbefore" name="Wait Before" description="Defines a delay in seconds that Mistral Engine should wait before starting a task." value={task['wait-before'] !== undefined} onChange={value => this.handleTaskProperty('wait-before', value !== false ? true : undefined)}>
        {
          task['wait-before'] !== undefined && (
            <div className={this.style.propertyChild}>
              <StringField value={task['wait-before'].toString()} onChange={value => value !== undefined && this.handleTaskProperty('wait-before', value)} />
            </div>
          )
        }
      </Property>,
      <Property key="waitafter" name="Wait After" description="Defines a delay in seconds that Mistral Engine should wait after a task has completed before starting next tasks defined in on-success, on-error or on-complete." value={task['wait-after'] !== undefined} onChange={value => this.handleTaskProperty('wait-after', value !== false ? true : undefined)}>
        {
          task['wait-after'] !== undefined && (
            <div className={this.style.propertyChild}>
              <StringField value={task['wait-after'].toString()} onChange={value => value !== undefined && this.handleTaskProperty('wait-after', value)} />
            </div>
          )
        }
      </Property>,
      <Property key="timeout" name="Timeout" description="Defines a period of time in seconds after which a task will be failed automatically by engine if it hasn’t completed." value={task.timeout !== undefined} onChange={value => this.handleTaskProperty('timeout', value !== false ? 0 : undefined)}>
        {
          task.timeout !== undefined && (
            <div className={this.style.propertyChild}>
              <StringField value={task.timeout.toString()} onChange={value => value !== undefined && this.handleTaskProperty('timeout', value)} />
            </div>
          )
        }
      </Property>,
      <Property key="retry" name="Retry" description="Defines a pattern how task should be repeated in case of an error." value={task.retry !== undefined} onChange={value => this.handleTaskProperty('retry', value !== false ? { count: 1, delay: 0 } : undefined)}>
        {
          task.retry !== undefined && (
            <div className={this.style.propertyChild}>
              <StringField name="Count" value={task.retry.count.toString()} onChange={value => value !== undefined && this.handleTaskProperty([ 'retry', 'count' ], value)} />
              <StringField name="Delay" value={task.retry.delay.toString()} onChange={value => value !== undefined && this.handleTaskProperty([ 'retry', 'delay' ], value)} />
              <StringField name="Continue On" value={(task.retry['continue-on'] || '').toString()} onChange={value => this.handleTaskProperty([ 'retry', 'continue-on' ], value)} />
              <StringField name="Break On" value={(task.retry['break-on'] || '').toString()} onChange={value => this.handleTaskProperty([ 'retry', 'break-on' ], value)} />
            </div>
          )
        }
      </Property>,
      <Property key="publish" name="Publish" description="Dictionary of variables to publish to the workflow context." value={task.publish !== undefined} onChange={value => this.handleTaskProperty('publish', value !== false ? {} : undefined)}>
        {
          task.publish !== undefined && (
            <div className={this.style.propertyChild}>
              <ObjectField value={task.publish} onChange={value => this.handleTaskProperty('publish', value)} />
            </div>
          )
        }
      </Property>,
      <Property key="publishonerror" name="Publish On Error" description="Same as publish but evaluated in case of task execution failures." value={task['publish-on-error'] !== undefined} onChange={value => this.handleTaskProperty('publish-on-error', value !== false ? {} : undefined)}>
        {
          task['publish-on-error'] !== undefined && (
            <div className={this.style.propertyChild}>
              <ObjectField value={task['publish-on-error']} onChange={value => this.handleTaskProperty('publish-on-error', value)} />
            </div>
          )
        }
      </Property>,
    ];
  }
}
