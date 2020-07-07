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

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { PropTypes } from 'prop-types';
import cx from 'classnames';
import _ from 'lodash';

import AutoForm from '@stackstorm/module-auto-form';
import Button from '@stackstorm/module-forms/button.component';
import { Panel, Toolbar, ToolbarButton } from './layout';
import { models } from '@stackstorm/st2flow-model';

import StringField from '@stackstorm/module-auto-form/fields/string';

import Task from './task';
import MistralProperties from './mistral-properties';
import MistralTransition from './mistral-transition';
import OrquestaProperties from './orquesta-properties';
import OrquestaTransition from './orquesta-transition';

import style from './style.css';

function makePanels(runnerType) {
  const model = models[runnerType];

  switch (model) {
    case models.mistral:
      return {
        properties: MistralProperties,
        transition: MistralTransition,
      };
    case models.orquesta:
      return {
        properties: OrquestaProperties,
        transition: OrquestaTransition,
      };
    default:
      return {
        properties: EmptyPanel,
        transition: EmptyPanel,
      };
  }
}

class EmptyPanel extends Component<{},{}> {
  render() {
    return false;
  }
}

type TaskDetailsProps = {
  meta: Object,

  tasks: Array<Object>,
  transitions: Array<Object>,
  issueModelCommand: Function,

  navigation: Object,
  navigate: Function,

  actions: Array<Object>,

  selected: string,
  onBack: Function,
};

@connect(
  ({ flow: { actions, navigation, tasks, transitions, meta }}) => ({ actions, navigation, tasks, transitions, meta }),
  (dispatch) => ({
    issueModelCommand: (command, ...args) => {
      dispatch({
        type: 'MODEL_ISSUE_COMMAND',
        command,
        args,
      });
    },
    navigate: (navigation) => dispatch({
      type: 'CHANGE_NAVIGATION',
      navigation,
    }),
  })
)
export default class TaskDetails extends Component<TaskDetailsProps, {
  rename: bool,
  name: string,
}> {
  static propTypes = {
    meta: PropTypes.object,

    tasks: PropTypes.array,
    transitions: PropTypes.array,
    issueModelCommand: PropTypes.func,

    navigation: PropTypes.object,
    navigate: PropTypes.func,

    actions: PropTypes.array,

    selected: PropTypes.string,
    onBack: PropTypes.func.isRequired,
  }

  constructor(props: TaskDetailsProps) {
    super(props);
    this.state = {
      rename: false,
      name: props.selected,
    };
  }

  handleNameChange(name: string) {
    this.setState({ name });
  }

  handleToggleRename() {
    const { rename } = this.state;
    const { selected } = this.props;
    this.setState({ rename: !rename, name: selected });
  }

  handleTaskRename(ref: string, name: string) {
    const { selected, issueModelCommand } = this.props;

    issueModelCommand('updateTask', { name: ref }, { name });

    if (selected === ref) {
      this.props.navigate({ toTasks: undefined, task: name });
    }
    this.setState({ rename: false });
  }

  handleTaskFieldChange(field: string, value: Object) {
    const { selected, issueModelCommand } = this.props;
    issueModelCommand('updateTask', { name: selected }, { [field]: value });
  }

  handleTaskProperty(name: string | Array<string>, value: any) {
    const { selected, issueModelCommand } = this.props;

    if (value) {
      issueModelCommand('setTaskProperty', { name: selected }, name, value);
    }
    else {
      issueModelCommand('deleteTaskProperty', { name: selected }, name);
    }
  }

  handleSectionSwitch(section: string) {
    this.props.navigate({ section });
  }

  style = style

  render() {
    const { selected, onBack, actions, navigation, tasks, transitions, meta } = this.props;
    const { section = 'input', toTasks } = navigation;
    const { name, rename } = this.state;

    const task = selected && tasks.find(task => task.name === selected);
    const taskNames = selected && tasks.map(task => task.name);

    if (!task) {
      return false;
    }

    const trans = !!selected && transitions.filter(t => t.from.name === selected);

    const action = actions.find(({ref}) => ref === task.action);

    const Panels = makePanels(meta.runner_type);

    return ([
      <Toolbar key="toolbar" secondary={true} >
        <ToolbarButton
          className="icon-chevron_left"
          onClick={() => onBack()}
        />
        {
          rename
            ? (
              <div className={this.style.input} >
                <StringField value={name} onChange={name => this.handleNameChange(name)} />
              </div>
            )
            : <Task onDoubleClick={() => this.handleToggleRename()} task={task} />
        }
        {
          rename
            && (
              <div className={cx(this.style.button, this.style.rename)} >
                <Button onClick={() => this.handleTaskRename(task.name, name)} value="Rename" disabled={_.includes(tasks.map(task => task.name),name) ? 'disabled' : ''} />
              </div>
            )
        }
        <div className={cx(this.style.button, this.style.edit)} >
          <Button onClick={() => this.handleToggleRename()} value={rename ? 'Cancel' : 'Edit'} />
        </div>
      </Toolbar>,
      <Toolbar key="subtoolbar" secondary={true} >
        <ToolbarButton stretch onClick={() => this.handleSectionSwitch('input')} selected={section === 'input'}>Input</ToolbarButton>
        <ToolbarButton stretch onClick={() => this.handleSectionSwitch('properties')} selected={section === 'properties'}>Properties</ToolbarButton>
        <ToolbarButton stretch onClick={() => this.handleSectionSwitch('transitions')} selected={section === 'transitions'}>Transitions</ToolbarButton>
      </Toolbar>,
      section === 'input' && (
        <Panel key="input">
          {!action && <p>Couldn&apos;t find action. Is the pack installed?</p>}
          <AutoForm
            spec={{
              type: 'object',
              properties: action && action.parameters || {},
            }}
            data={task.input}
            onChange={(runValue) => this.handleTaskFieldChange('input', { ...task.input, ...runValue })}
          />
        </Panel>
      ),
      section === 'properties' && (
        <Panel key="properties">
          <Panels.properties task={task} />
        </Panel>
      ),
      section === 'transitions' && (
        <Panel key="transitions">
          {
            (trans || []).map((transition, index) => {
              // TODO: this logic could result in false positives - we need to compare conidtions too
              const selected = toTasks && toTasks.length === transition.to.length && transition.to.every((t, i) => toTasks[i] === t.name);
              return <Panels.transition key={index} selected={selected} transition={transition} taskNames={taskNames} />;
            })
          }
          <div className={this.style.transitionInfo}>
            To add a transition, hover over a task box and drag the connector to the desired task box you want to transition to.
          </div>
        </Panel>
      ),
    ]);
  }
}
