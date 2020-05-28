// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

//@flow

import type { TaskInterface } from '@stackstorm/st2flow-model/interfaces';

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import Editor from '@stackstorm/st2flow-editor';
import { Toolbar, ToolbarButton } from './layout';

import Meta from './meta-panel';
import TaskDetails from './task-details';
import TaskList from './task-list';

import style from './style.css';

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
  }

  sections = [{
    title: 'metadata',
    className: 'icon-gear',
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

  render() {
    const { actions, navigation, navigate } = this.props;

    const { type = 'metadata', asCode } = navigation;

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
          <ToolbarButton className={cx(style.code, 'icon-code')} selected={asCode} onClick={() => navigate({ asCode: !asCode })} />
        </Toolbar>
        {
          type === 'metadata' && (
            asCode
              && <MetaEditor />
              // $FlowFixMe Model is populated via decorator
              || <Meta />
          )
        }
        {
          type === 'execution' && (
            asCode
              && <WorkflowEditor selectedTaskName={navigation.task} onTaskSelect={this.handleTaskSelect} />
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
