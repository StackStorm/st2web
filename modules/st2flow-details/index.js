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
import { connect } from 'react-redux';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import Editor from '@stackstorm/st2flow-editor';
import { editorConnect } from '@stackstorm/st2flow-editor';

import { Toolbar, ToolbarButton } from './layout';

import Meta from './meta-panel';
import TaskDetails from './task-details';
import TaskList from './task-list';

import style from './style.css';
import store from '../../apps/st2-workflows/store';

@connect(
  editorConnect
)
@connect(
  ({ flow: { metaSource }}) => ({
    source: metaSource,
  }),
  (dispatch, source) => ({
    onEditorChange: source => dispatch({
      type: 'META_ISSUE_COMMAND',
      command: 'applyDelta',
      args: [ null, source ],
    }),
  })
)
class MetaEditor extends Editor {}

@connect(
  editorConnect
)
@connect(
  ({ flow: { workflowSource }}) => ({
    source: workflowSource,
  }),
  (dispatch, source) => ({
    onEditorChange: source => dispatch({
      type: 'MODEL_ISSUE_COMMAND',
      command: 'applyDelta',
      args: [ null, source ],
    }),
  })
)
class WorkflowEditor extends Editor {}

@connect(
  ({ flow: { actions, navigation }}) => ({ actions, navigation }),
  (dispatch) => ({
    navigate: (navigation) => dispatch({
      type: 'CHANGE_NAVIGATION',
      navigation,
    }),
  })
)
export default class Details extends Component<{
  className?: string,

  navigation: Object,
  navigate: Function,

  actions: Array<Object>,
}> {
  static propTypes = {
    className: PropTypes.string,

    navigation: PropTypes.object,
    navigate: PropTypes.func,

    actions: PropTypes.array,

    onChange: PropTypes.func,
  }

  sections = [{
    title: 'metadata',
    className: 'icon-gear gearclass',
  }, {
    title: 'execution',
    className: 'icon-lan',
  }]

  style = style

  handleTaskSelect = (task: TaskInterface) => {
    this.props.navigate({ toTasks: undefined, task: task.name });
  }

  handleBack = () => {
    this.props.navigate({ toTasks: undefined, task: undefined });
  }

  toggleAutosave = (autosaveEnabled) => {
    store.dispatch({
      type: 'TOGGLE_AUTOSAVE',
      autosaveEnabled,
    });
  }

  render() {
    const { actions, navigation, navigate, onChange } = this.props;

    const { type = 'metadata', asCode } = navigation;

    const { autosaveEnabled } = store.getState();

    return (
      <div className={cx(this.props.className, this.style.component, asCode && 'code')}>
        <Toolbar>
          {
            this.sections.map(section => {
              return (
                <ToolbarButton
                  key={section.title}
                  className={section.className}
                  selected={type === section.title}
                  onClick={() => navigate({ type: section.title, section: undefined })}
                />
              );
            })
          }
          <div
            style={{display: 'flex'}} title="Automatically save the workflow on every change"
          >
            <input
              id='autosave-checkbox' 
              name='autosave-checkbox' 
              type='checkbox'
              onChange={(e) => {
                this.toggleAutosave(e.target.checked);
                onChange();
              }} 
              className={cx(style.autosave)}
              defaultChecked={autosaveEnabled}
            />
            <label id='autosave-checkbox__label' htmlFor='autosave-checkbox' className={cx(style.autosave)}>Autosave</label>
          </div>
          <ToolbarButton className={cx(style.code, 'icon-code')} selected={asCode} onClick={() => navigate({ asCode: !asCode })} />
        </Toolbar>
        {
          type === 'metadata' && (
            asCode
              && <MetaEditor onChange={() => onChange()} />
              // $FlowFixMe Model is populated via decorator
              || <Meta onChange={() => onChange()} />
          )
        }
        {
          type === 'execution' && (
            asCode
              && <WorkflowEditor selectedTaskName={navigation.task} onTaskSelect={this.handleTaskSelect} onChange={() => onChange()} />
              || navigation.task
                // $FlowFixMe ^^
                && <TaskDetails onBack={this.handleBack} selected={navigation.task} actions={actions} />
                // $FlowFixMe ^^
                || <TaskList />
          )
        }
      </div>
    );
  }
}
