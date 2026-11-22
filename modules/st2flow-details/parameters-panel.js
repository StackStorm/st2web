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

import Parameter from './parameter';
import ParameterEditor from './parameter-editor';
import Button from '@stackstorm/module-forms/button.component';

import { Panel } from './layout';

function sortParameters(params) {
  const keys = Object.keys(params);
  keys.sort((a, b) => {
    const aPos = params[a].position;
    const bPos = params[b].position;

    if(aPos == null && bPos == null) {
      return 0;
    }
    if(aPos == null) {
      return 1;
    }
    if(bPos == null) {
      return -1;
    }
    return aPos - bPos;
  });
  const retVal = {};
  keys.forEach(key => {
    retVal[key] = params[key];
  });
  return retVal;
}

class Parameters extends Component {
  state = {
    edit: false,
  };

  handleAdd({ name, ...properties }) {
    const parameters = this.props.meta.parameters;
    this.props.setMeta('parameters', sortParameters({ ...parameters, [name]: properties}));
    this.setState({ edit: false });
  }

  handleChange(oldName, { name, ...properties }) {
    const { ...parameters } = this.props.meta.parameters;
    if (oldName !== name) {
      delete parameters[oldName];
    }
    this.props.setMeta('parameters', sortParameters({ ...parameters, [name]: properties}));
    this.setState({ edit: false });
  }

  handleDelete(name) {
    const { ...parameters } = this.props.meta.parameters;
    delete parameters[name];
    this.props.setMeta('parameters', parameters);
  }

  render() {
    const { meta } = this.props;
    const { edit } = this.state;

    return (
      <Panel>
        {
          edit === false && meta.parameters && meta.parameters.__meta.keys.map(name => (
            <Parameter
              key={name}
              name={name}
              parameter={meta.parameters[name]}
              onEdit={parameter => this.setState({ edit: name })}
              onDelete={() => this.handleDelete(name)}
            />
          ))
        }
        {
          edit === false && <Button value="Add parameter" onClick={() => this.setState({ edit: true })} />
        }
        {
          edit === true &&
            //$FlowFixMe
            <ParameterEditor onChange={parameter => this.handleAdd(parameter)} onCancel={() => this.setState({ edit: false })} />
        }
        {
          typeof edit === 'string' && (
            <ParameterEditor
              parameter={{ ...meta.parameters[edit], name: edit }}
              onChange={parameter => this.handleChange(edit, parameter)}
              onCancel={() => this.setState({ edit: false })}
            />
          )
        }
      </Panel>
    );
  }
}

export default connect(
  ({ flow: { meta }}) => ({ meta }),
  (dispatch) => ({
    setMeta: (field, value) => dispatch({
      type: 'META_ISSUE_COMMAND',
      command: 'set',
      args: [ field, value ],
    }),
  })
)(Parameters);
