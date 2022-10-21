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

import React, { Component } from 'react';
// import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { PropTypes } from 'prop-types';
import { mapValues, get } from 'lodash';
import cx from 'classnames';
import url from 'url';
import Menu from '@stackstorm/module-menu';
import Palette from '@stackstorm/st2flow-palette';
import Canvas from '@stackstorm/st2flow-canvas';
import Details from '@stackstorm/st2flow-details';
import api from '@stackstorm/module-api';
import { Toolbar, ToolbarButton, ToolbarDropdown } from '@stackstorm/st2flow-canvas/toolbar';
import AutoForm from '@stackstorm/module-auto-form';
import Button from '@stackstorm/module-forms/button.component';
import { Route } from '@stackstorm/module-router';
import globalStore from '@stackstorm/module-store';
import store from './store';
import style from './style.css';

const POLL_INTERVAL = 5000;

@connect(
  ({ flow: {
    panels, actions, meta, metaSource, workflowSource, pack, input, dirty,
  } }) => ({ isCollapsed: panels, actions, meta, metaSource, workflowSource, pack, input, dirty }),
  (dispatch) => ({
    fetchActions: () => dispatch({
      type: 'FETCH_ACTIONS',
      promise: api.request({ path: '/actions/views/overview' })
        .catch(() => fetch('/actions.json').then(res => res.json())),
    }),
   
    sendError: (message, link) => dispatch({ type: 'PUSH_ERROR', error: message, link }),
    sendSuccess: (message, link) => dispatch({ type: 'PUSH_SUCCESS', message, link }),
    undo: () => dispatch({ type: 'FLOW_UNDO' }),
    redo: () => dispatch({ type: 'FLOW_REDO' }),
    layout: () => dispatch({ type: 'MODEL_LAYOUT' }),
    setMeta: (attribute, value) => dispatch({ type: 'META_ISSUE_COMMAND', command: 'set', args: [ attribute, value ] }),
  })
)
// class Window extends Component<{
export default class Workflows extends Component {  
 static propTypes = {
   pack: PropTypes.string,
   meta: PropTypes.object,
   metaSource: PropTypes.string,
   setMeta: PropTypes.func,  // eslint-disable-line react/no-unused-prop-types
   input: PropTypes.array,
   workflowSource: PropTypes.string,
   dirty: PropTypes.bool,
   isCollapsed: PropTypes.object,
   actions: PropTypes.array,
   fetchActions: PropTypes.func,
   undo: PropTypes.func,
   redo: PropTypes.func,
   layout: PropTypes.func,
   sendSuccess: PropTypes.func,
   sendError: PropTypes.func,
   routes: PropTypes.arrayOf(PropTypes.shape({
     title: PropTypes.string.isRequired,
     href: PropTypes.string,
     url: PropTypes.string,
     target: PropTypes.string,
     icon: PropTypes.string,
   })).isRequired,
 }
 state = {
   runningWorkflow: false,
   showForm: false,
   runFormData: {},
 };

 async componentDidMount() {
   this.props.fetchActions();
 }

 handleFormChange(data) {
   
   if(!data) {
     data = {};
   }
   this.setState({
     runFormData: {
       ...this.state.runFormData,
       ...data,
     },
   });
 }

 openForm() {
   this.setState({
     showForm: true,
   });
 }

 closeForm() {
   this.setState({
     showForm: false,
   });
 }

 get formIsValid() {
   const { meta: { parameters = {} } } = this.props;
   const { runFormData } = this.state;
   const paramNames = Object.keys(parameters);

   let valid = true;

   paramNames.forEach(name => {
     const { required } = parameters[name] || {};
     if(required && runFormData[name] == null && parameters[name].default == null) {
       valid = false;
     }
   });
   Object.keys(runFormData).forEach(formKey => {
     if(!paramNames.includes(formKey) && runFormData[formKey] == null) {
       valid = false;
     }
   });

   return valid;
 }

 run() {
   const { meta, input, sendSuccess, sendError } = this.props;
   const { runningWorkflow, runFormData } = this.state;

   if(runningWorkflow) {
     return Promise.reject('Workflow already started');
   }
   this.setState({ runningWorkflow: true });

   const inputValues = input.reduce((acc, maybeInputValue) => {
     if(typeof maybeInputValue === 'string') {
       return acc;
     }
     else {
       const key = Object.keys(maybeInputValue)[0];
       return {
         ...acc,
         [key]: maybeInputValue[key],
       };
     }
   }, {});

   let parameters = mapValues(meta.parameters || {}, (param, paramName) => {
     if(inputValues.hasOwnProperty(paramName)) {
       return inputValues[paramName];
     }
     else {
       return param.default;
     }
   }, {});
   parameters = {
     ...parameters,
     ...runFormData,
   };

    
   return api.request({
     method: 'post',
     path: '/executions',
   }, {
     action: `${meta.pack}.${meta.name}`,
     action_is_workflow: true,
     parameters,
   }).then(resp => {
     const executionUrl = url.parse(resp.web_url);

     sendSuccess(
       `Workflow ${resp.liveaction.action} submitted for execution. Details at `,
       `${executionUrl.path}${executionUrl.hash}`
     );
     setTimeout(this.poll.bind(this), POLL_INTERVAL, resp.id);
     this.closeForm();
   }, err => {
     this.setState({ runningWorkflow: false });
     sendError(`Submitting workflow ${meta.name} failed: ${get(err, 'response.data.faultstring') || err.message}`);
     throw err;
   });
 }

 poll(workflowId) {
   const { sendSuccess, sendError } = this.props;
   return api.request({
     method: 'get',
     path: `/executions?id=${workflowId}`,
   }).then(([ execution ]) => {
     const executionUrl = url.parse(execution.web_url);
     switch(execution.status) {
       case 'failed': {
         sendError(
           `Workflow ${execution.liveaction.action} failed. Details at `,
           `${executionUrl.path}${executionUrl.hash}`
         );
         this.setState({ runningWorkflow: false });
         break;
       }
       case 'succeeded': {
         sendSuccess(
           `Workflow ${execution.liveaction.action} succeeded in ${execution.elapsed_seconds}s. Details at `,
           `${executionUrl.path}${executionUrl.hash}`
         );
         this.setState({ runningWorkflow: false });
         break;
       }
       // requesting, scheduled, or running
       default: {
         setTimeout(this.poll.bind(this), POLL_INTERVAL, workflowId);
         break;
       }
     }
   });
 }

 save() {
   const { pack, meta, actions, workflowSource, metaSource, sendSuccess, sendError } = this.props;
   const existingAction = actions.find(e => e.name === meta.name && e.pack === pack);

   if (!meta.name) {
     throw { response: { data: { faultstring: 'You must provide a name of the workflow.'}}};
   }
   
   if (!meta.entry_point) {
     throw { response: { data: { faultstring: 'You must provide a entry point of the workflow.'}}};
   }

   meta.pack = pack;
   meta.metadata_file = existingAction && existingAction.metadata_file && existingAction.metadata_file || `actions/${meta.name}.meta.yaml`;
   meta.data_files = [{
     file_path: meta.entry_point,
     content: workflowSource,
   }, {
     file_path: existingAction && existingAction.metadata_file && existingAction.metadata_file.replace(/^actions\//, '') || `${meta.name}.meta.yaml`,
     content: metaSource,
   }];

   const promise = (async () => {
     if (existingAction) {

       // remove "_name" key from parameter keys for successful request
       if (meta.parameters) {
         Object.keys(meta.parameters).forEach(key => {
           if (meta.parameters[key]._name) {
             delete meta.parameters[key]._name;
           }
         });
       }

       await api.request({ method: 'put', path: `/actions/${pack}.${meta.name}` }, meta);
     }
     else {
       await api.request({ method: 'post', path: '/actions' }, meta);
       this.props.fetchActions();
     }
     // don't need to return anything to the store. the handler will change dirty.
     return {};
   })();
  
   const saveRes = store.dispatch({
     type: 'SAVE_WORKFLOW',
     promise,
   });

   saveRes.then(({ status }) => status === 'success' ? sendSuccess('Workflow saved.') : sendError('Error saving workflow.'));

   return promise;
 }

  timer;

  autosave(func) {
    func.apply(this);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      const { autosaveEnabled } = store.getState();

      if (autosaveEnabled) {
        this.save();
      }
    }, 1000);
  }

  style = style

  keyHandlers = {
    undo: () => {
      store.dispatch({ type: 'FLOW_UNDO' });
    },
    redo: () => {
      store.dispatch({ type: 'FLOW_REDO' });
    },
    save: async (x) => {
      if (x) {
        x.preventDefault();
        x.stopPropagation();
      }

      try {
        await this.save();
        store.dispatch({ type: 'PUSH_SUCCESS', source: 'icon-save', message: 'Workflow saved.' });
      }
      catch(e) {
        const faultString = get(e, 'response.data.faultstring');
        store.dispatch({ type: 'PUSH_ERROR', source: 'icon-save', error: `Error saving workflow: ${faultString}` });
      }
    },
    copy: () => {
      store.dispatch({ type: 'PUSH_WARNING', source: 'icon-save', message: 'Select a task to copy' });
    },
    cut: () => {
      store.dispatch({ type: 'PUSH_WARNING', source: 'icon-save', message: 'Nothing to cut' });
    },
    paste: () => {
      store.dispatch({ type: 'PUSH_WARNING', source: 'icon-save', message: 'Nothing to paste' });
    },
  }

  render() {
    // const { isCollapsed = {}, toggleCollapse, actions, undo, redo, layout, meta, input, dirty } = this.props;
    const { isCollapsed = {}, actions, undo, redo, layout, meta, input, dirty} = this.props;
    const { runningWorkflow, showForm } = this.state;
   
    const autoFormData = input && input.reduce((acc, value) => {
      if(typeof value === 'object') {
        acc = { ...acc, ...value };
      }
      return acc;
    }, {});
   
    return (
      <Route
        path='/action/:ref?/:section?'
        render={({ match, location }) => {
          return (
            <Provider store={globalStore}>
              <div className="component">
                <Menu location={location} routes={this.props.routes} /> 
                <div className="component-row-content">
                  { !isCollapsed.palette && <Palette className="palette" actions={actions} /> }
                  <div
                    style={{ flex: 1}}
                  >
                    <Canvas
                      className="canvas"
                      location={location}
                      match={match}
                      dirtyflag={this.props.dirty}
                      fetchActionscalled={e => this.props.fetchActions()}
                      saveData={e => this.autosave(() => null)}
                      save={this.keyHandlers.save}
                      undo={() => this.autosave(() => this.keyHandlers.undo())}
                      redo={() => this.autosave(() => this.keyHandlers.redo())}
                    >
                      <Toolbar>
                        <ToolbarButton key="undo" icon="icon-redirect" title="Undo" errorMessage="Could not undo." onClick={() => this.autosave(() => undo())} />
                        <ToolbarButton key="redo" icon="icon-redirect2" title="Redo" errorMessage="Could not redo." onClick={() => this.autosave(() => redo())} />
                        <ToolbarButton
                          key="rearrange"
                          icon="icon-arrange"
                          title="Rearrange tasks"
                          successMessage="Rearrange complete."
                          errorMessage="Error rearranging workflows."
                          onClick={() => this.autosave(() => layout())}
                        />
                        <ToolbarButton
                          key="save"
                          className={cx(dirty && 'glow')}
                          icon="icon-save"
                          title="Save workflow"
                          errorMessage="Error saving workflow."
                          onClick={() => this.save()}
                        />
                        <ToolbarButton
                          key="run"
                          icon="icon-play"
                          title={dirty ? 'Cannot run with unsaved changes' : 'Run workflow'}
                          disabled={runningWorkflow || dirty}
                          onClick={() => this.openForm()}
                        />
                        <ToolbarDropdown shown={showForm} pointerPosition='calc(50% + 85px)' onClose={() => this.closeForm()}>
                          {
                            meta.parameters && Object.keys(meta.parameters).length
                              ? <h2>Run workflow with inputs</h2>
                              : <h2>Run workflow</h2>
                          }
                          <AutoForm
                            spec={{
                              type: 'object',
                              properties: meta.parameters,
                            }}
                            data={autoFormData}
                            onChange={(runValue) => this.handleFormChange(runValue)}
                            onError={(error, runValue) => this.handleFormChange(runValue)}
                          />
                          <div className='buttons' style={{marginTop: 15}}>
                            <Button onClick={() => this.run()} disabled={!this.formIsValid} value="Execute Workflow" />
                            <Button onClick={() => this.closeForm()} value="Close" />
                          </div>
                        </ToolbarDropdown>
                      </Toolbar>
                    </Canvas>
                  </div>
                  { !isCollapsed.details && <Details className="details" actions={actions} onChange={() => this.autosave(() => null)} /> }
                </div>
              </div>
          
            </Provider>
          
          );
        }}
      />
    );

   
  }
}

globalStore.subscribe(() => {
 
  const { location } = globalStore.getState();

  let match;

  match = location.pathname.match('^/import/(.+)/(.+)');
  if (match) {
    const [ ,, action ] = match;

    globalStore.dispatch({
      type: 'CHANGE_LOCATION',
      location: {
        ...location,
        pathname: `/action/${action}`,
      },
    });
    return;
  }

  match = location.pathname.match('^/action/(.+)');
  if (match) {
    const [ , ref ] = match;
  
    const { currentWorkflow } = store.getState();
   
    if (currentWorkflow !== ref) {
      store.dispatch({
        type: 'LOAD_WORKFLOW',
        currentWorkflow: ref,
        promise: (async () => {
          const action = await api.request({ path: `/actions/${ref}` });
          const [ pack ] = ref.split('.');
          const [ metaSource, workflowSource ] = await Promise.all([
            api.request({ path: `/packs/views/file/${pack}/${action.metadata_file}`}),
            api.request({ path: `/packs/views/file/${pack}/actions/${action.entry_point}`}),
          ]);
          return {
            metaSource,
            workflowSource,
          };
        })(),
      });
    }
    return;
  }
});

// const routes = [{
//   url: '/',
//   Component: Workflows,
// }];

// ReactDOM.render(<Provider store={globalStore}><Router routes={routes} /></Provider>, document.querySelector('#container'));
