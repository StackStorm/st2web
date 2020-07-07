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

import BooleanField from '@stackstorm/module-auto-form/fields/boolean';
import StringField from '@stackstorm/module-auto-form/fields/string';
import EnumField from '@stackstorm/module-auto-form/fields/enum';
import Button from '@stackstorm/module-forms/button.component';
import { isJinja } from '@stackstorm/module-auto-form/fields/base';

import { Panel, Toolbar, ToolbarButton } from './layout';
import Parameters from './parameters-panel';
import { StringPropertiesPanel } from './string-properties';

const default_runner_type = 'orquesta';

@connect(
  ({ flow: { pack, actions, navigation, meta, input, vars }}) => ({ pack, actions, navigation, meta, input, vars }),
  (dispatch) => ({
    navigate: (navigation) => dispatch({
      type: 'CHANGE_NAVIGATION',
      navigation,
    }),
    setMeta: (field, value) => {
      try{
        dispatch({
          type: 'META_ISSUE_COMMAND',
          command: 'set',
          args: [ field, value ],
        });
      }
      catch(error) {
        dispatch({
          type: 'PUSH_ERROR',
          error,
        });
      }
    },
    setVars: (value) => {
      dispatch({
        type: 'MODEL_ISSUE_COMMAND',
        command: 'setVars',
        args: [ value ],
      });
    },
    setPack: (pack) => {
      dispatch({
        type: 'SET_PACK',
        pack,
      });
      try{
        dispatch({
          type: 'META_ISSUE_COMMAND',
          command: 'set',
          args: [ 'pack', pack ],
        });
      }
      catch(error) {
        dispatch({
          type: 'PUSH_ERROR',
          error,
        });
      }
    },
  })
)
export default class Meta extends Component<{
  pack: string,
  setPack: Function,

  meta: Object,
  setMeta: Function,

  navigation: Object,
  navigate: Function,

  actions: Array<Object>,
  vars: Array<Object>,
  setVars: Function,
}> {
  static propTypes = {
    pack: PropTypes.string,
    setPack: PropTypes.func,

    meta: PropTypes.object,
    setMeta: PropTypes.func,

    navigation: PropTypes.object,
    navigate: PropTypes.func,

    actions: PropTypes.array,
    vars: PropTypes.array,
    setVars: PropTypes.func,
  }

  componentDidUpdate() {
    const { meta, setMeta } = this.props;

    if (!meta.runner_type) {
      setMeta('runner_type', default_runner_type);
    }
  }

  handleSectionSwitch(section: string) {
    this.props.navigate({ section });
  }

  handleVarsChange(publish: Array<{}>) {
    const { setVars } = this.props;
    const val = (publish ? publish.slice(0) : []).map(kv => {
      const key = Object.keys(kv)[0];
      const val = kv[key];
      if (val === '') {
        return { [key]: null };
      }
      else if (isJinja(val)) {
        return kv;
      }
      else {
        try {
          const parsedVal = JSON.parse(val);
          return { [key]: typeof parsedVal === 'object' ? parsedVal : val };
        }
        catch(e) {
          return kv;
        }
      }
    });

    // Make sure to mutate the copy
    setVars(val);
  }

  addVar() {
    const { setVars, vars } = this.props;
    const newVal = { key: '' };
    setVars((vars || []).concat([ newVal ]));
  }

  render() {
    const { pack, setPack, meta, setMeta, navigation, actions, vars } = this.props;
    const { section = 'meta' } = navigation;

    const stringVars = vars && vars.map(kv => {
      const key = Object.keys(kv)[0];
      const val = kv[key];
      if(typeof val === 'object') {
        // nulls and objects both here.
        return { [key]: val ? JSON.stringify(val, null, 2) : '' };
      }
      else {
        return { [key]: val.toString() };
      }
    });

    const packs = [ ...new Set(actions.map(a => a.pack)).add(pack) ];

    return ([
      <Toolbar key="subtoolbar" secondary={true} >
        <ToolbarButton stretch onClick={() => this.handleSectionSwitch('meta')} selected={section === 'meta'}>Meta</ToolbarButton>
        <ToolbarButton stretch onClick={() => this.handleSectionSwitch('parameters')} selected={section === 'parameters'}>Parameters</ToolbarButton>
        <ToolbarButton stretch onClick={() => this.handleSectionSwitch('vars')} selected={section === 'vars'}>Vars</ToolbarButton>
      </Toolbar>,
      section === 'meta' && (
        <Panel key="meta">
          <EnumField name="Runner Type" value={meta.runner_type} spec={{enum: [ ...new Set([ 'mistral-v2', 'orquesta' ]) ], default: default_runner_type}} onChange={(v) => setMeta('runner_type', v)} />
          <EnumField name="Pack" value={pack} spec={{enum: packs}} onChange={(v) => setPack(v)} />
          <StringField name="Name" value={meta.name} onChange={(v) => setMeta('name', v || '')} />
          <StringField name="Description" value={meta.description} onChange={(v) => setMeta('description', v)} />
          <BooleanField name="Enabled" value={meta.enabled} spec={{}} onChange={(v) => setMeta('enabled', v)} />
          <StringField name="Entry point" value={meta.entry_point} onChange={(v) => setMeta('entry_point', v || '')} />
        </Panel>
      ),
      section === 'parameters' && (
        //$FlowFixMe
        <Parameters key="parameters" />
      ),
      section === 'vars' && (
        <Panel key="vars">
          <StringPropertiesPanel
            items={stringVars || []}
            defaultKey="key"
            defaultValue=""
            onChange={val => this.handleVarsChange(val)}
          />
          { vars && vars.length > 0 && <hr /> }
          <Button value="Add variable" onClick={() => this.addVar()} />
        </Panel>
      ),
    ]);
  }
}
