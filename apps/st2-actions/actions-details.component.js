// Copyright 2021 The StackStorm Authors.
// Copyright 2019 Extreme Networks, Inc.
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

import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import store from './store';

import api from '@stackstorm/module-api';
import notification from '@stackstorm/module-notification';
import setTitle from '@stackstorm/module-title';

import { Link } from '@stackstorm/module-router';
import ActionReporter from '@stackstorm/module-action-reporter';
import AutoForm from '@stackstorm/module-auto-form';
import StringField from '@stackstorm/module-auto-form/fields/string';
import EnumField from '@stackstorm/module-auto-form/fields/enum';
import get from 'lodash/fp/get';

import {
  FlexTable,
  FlexTableRow,
  FlexTableColumn,
  FlexTableInsert,
} from '@stackstorm/module-flex-table';
import Button from '@stackstorm/module-forms/button.component';
import Highlight from '@stackstorm/module-highlight';
import Label from '@stackstorm/module-label';
import {
  PanelDetails,
  DetailsHeader,
  DetailsSwitch,
  DetailsBody,
  DetailsPanel,
  DetailsPanelEmpty,
  DetailsPanelBody,
  DetailsToolbar,
  DetailsToolbarSeparator,
} from '@stackstorm/module-panel';
import Time from '@stackstorm/module-time';

@connect((state) => {
  const { action, executions, entrypoint } = state;
  return { action, executions, entrypoint };
})
export default class ActionsDetails extends React.Component {
  static propTypes = {
    handleNavigate: PropTypes.func.isRequired,
    handleRun: PropTypes.func.isRequired,
    handleDelete: PropTypes.func.isRequired,

    id: PropTypes.string,
    section: PropTypes.string,
    action: PropTypes.object,
    executions: PropTypes.array,
    entrypoint: PropTypes.string,
    groups: PropTypes.array,
    filter: PropTypes.string,
    match: PropTypes.shape({
      params: PropTypes.shape({
        ref: PropTypes.string,
        section: PropTypes.string,
      }),
    }),
  }

  state = {
    runPreview: false,
    runValue: null,
    runTrace: null,
    executionsVisible: {},
    openModel: false,
    isChecked: false,
    destinationPack:'',
    destinationAction:'',
    packs:[],
    isRemoveFiles : false,
    
  }

  componentDidMount() {
    api.listen().then((source) => {
      this._source = source;

      this._executionCreateListener = (e) => {
        const record = JSON.parse(e.data);

        if (record.action.id !== this.props.action.id) {
          return;
        }

        store.dispatch({
          type: 'CREATE_EXECUTION',
          record,
        });
      };

      this._executionUpdateListener = (e) => {
        const record = JSON.parse(e.data);

        if (record.action.id !== this.props.action.id) {
          return;
        }

        store.dispatch({
          type: 'UPDATE_EXECUTION',
          record,
        });
      };

      this._executionDeleteListener = (e) => {
        const record = JSON.parse(e.data);

        if (record.action.id !== this.props.action.id) {
          return;
        }

        store.dispatch({
          type: 'DELETE_EXECUTION',
          record,
        });
      };

      this._source.addEventListener('st2.execution__create', this._executionCreateListener);
      this._source.addEventListener('st2.execution__update', this._executionUpdateListener);
      this._source.addEventListener('st2.execution__delete', this._executionDeleteListener);
    });

    const { id } = this.props;

    if (id) {
      this.fetchAction(id);
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const {groups, filter} = nextProps;
    const packs = [];
    if(!filter) {
      groups && groups.map(data => {
        packs.push(data.pack);
      });

      this.setState({packs : packs});
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { id , filter} = this.props;

 
    if (id && id !== prevProps.id) {
      this.fetchAction(id);
    }

    if(filter && filter !== prevProps.filter) {
      this.setState({packs: prevState.packs});
    }
  }

  componentWillUnmount() {
    this._source.removeEventListener('st2.execution__create', this._executionCreateListener);
    this._source.removeEventListener('st2.execution__update', this._executionUpdateListener);
    this._source.removeEventListener('st2.execution__delete', this._executionDeleteListener);
  }

  refresh() {
    const { id } = this.props;

    this.fetchAction(id);
  }

  fetchAction(id) {
    store.dispatch({
      type: 'FETCH_ACTION',
      promise: api.request({ path: `/actions/views/overview/${id}` }),
    })
      .then(() => {
        this.setState({ runValue: {}, runTrace: '' });
      })
      .catch((err) => {
        notification.error(`Unable to retrieve action "${id}".`, { err });
        throw err;
      })
    ;

    store.dispatch({
      type: 'FETCH_EXECUTIONS',
      promise: api.request({
        path: '/executions',
        query: {
          action: id,
          limit: 5,
          exclude_attributes: 'trigger_instance',
          parent: 'null',
        },
      }),
    })
      .catch((err) => {
        notification.error(`Unable to retrieve history for action "${id}".`, { err });
        throw err;
      })
    ;

    store.dispatch({
      type: 'FETCH_ENTRYPOINT',
      promise: api.request({
        path: `/actions/views/entry_point/${id}`,
        raw: true,
      }).then(res => res.data),
    })
      .catch((err) => {
        notification.error(`Unable to retrieve entrypoint for action "${id}".`, { err });
        throw err;
      })
    ;
  }

  minMax (value) {
    if (value < 0 || value > 2492000) {
      return true;
    }
    return false;
  }

  isExpression (value) {
    if (value.startsWith('{{') && value.endsWith('}}')) {
      return true;
    } 
    else if (value.startsWith('<%') && value.endsWith('%>')) {
      return true;
    } 
    else {
      return false;
    }
  }

  isValidInt (value) {
    for ( let n = 0; n < value.length; n += 1) {
      const digit = (value.charCodeAt(n) >= 48 && value.charCodeAt(n) <= 57)  || value.charCodeAt(n) === 45 || value.charCodeAt(n) === 8;
      if (!digit) {
        return true;
      }
    }
    return false;
  }

  handleSection(section) {
    const { id } = this.props;
    return this.props.handleNavigate({ id, section });
  }

  handleToggleRunPreview() {
    let { runPreview } = this.state;

    runPreview = !runPreview;

    this.setState({ runPreview });
  }

  handleToggleExecution(id) {
    this.setState({
      executionsVisible: {
        ...this.state.executionsVisible,
        [id]: !this.state.executionsVisible[id],
      },
    });
  }

  setWindowName(e) {
    window.name = 'parent';
  }

  handleRun(e, ...args) {
    e.preventDefault();
    return this.props.handleRun(...args);
  }

  handleClone(e, srcPack,srcAction, destAction,destPack, overwrite) {
    e.preventDefault();
    return store.dispatch({
      type: 'CLONE_ACTION',
      promise: api.request({
        method: 'post',
        path: `/actions/${srcPack}.${srcAction}/clone`,    
      },{
        'dest_pack': destPack, 
        'dest_action': destAction, 
        'overwrite': overwrite,
      
      })
        .then((execution) => {
          document.getElementById('overlay').style.display = 'none';
          notification.success(`Action "${srcAction}" has been cloned successfully.`);
          this.getActions();
          return execution;
        })
        .catch((err) => {
          if (err.response) {
            const error = document.getElementById('error');
            error.textContent = err.response.data.faultstring;
            error.style.color = 'red';
          }
        }),
    });
  }

  getActions() {
    return store.dispatch({
      type: 'FETCH_GROUPS',
      promise: api.request({ 
        path: '/actions', 
        query: {
          include_attributes: [
            'ref',
            'pack',
            'name',
            'description',
            'runner_type',
          ],
        },
      })
        .catch((err) => {
          notification.error('Unable to retrieve actions.', { err });
          throw err;
        }),
    })
      .then(() => {
        const { id } = this.urlParams;
        const { groups } = this.props;

        if (id && groups && !groups.some(({ actions }) => actions.some(({ ref }) => ref === id))) {
          this.navigate({ id: false });
        }
      })
    ;
  }

  get urlParams() {
    const {
      ref = get('groups[0].actions[0].ref', this.props),
      section = 'general',
    } = this.props.match.params;

    return {
      id: ref,
      section,
    };
  }

  openModel (e) {
    const {action} = this.props;
    const el =  document.getElementById('overlay');
    el.style.display = 'block'; 
    this.setState({ destinationPack:action.pack, destinationAction:'', isChecked: false});
  }

  closeModel() {
    document.getElementById('overlay').style.display = 'none';
  }

  handleDropdown(e) {
    const error = document.getElementById('error');
    error.textContent = '';
    this.setState({destinationPack:e});
  }

  handleInput(e) {
    const error = document.getElementById('error');
    error.textContent = '';
    this.setState({destinationAction:e});
  }

  handleChange(e) {
    const isChecked = document.getElementById('checkbox').checked;
    if(isChecked) {
      this.setState({isChecked:true});
    } 
    else {
      this.setState({isChecked:false});
    }
  }

  handleDeleteChange(e) {
    const isChecked = document.getElementById('deletecheckbox').checked;
    if(isChecked) {
      this.setState({isRemoveFiles:true});
    } 
    else {
      this.setState({isRemoveFiles:false});
    }
  }
 
  openDeleteModel (e) {
    this.setState({isRemoveFiles: false});
    const el =  document.getElementById('delete');
    el.style.display = 'block'; 
  }

  handleDelete (e) {
    e.preventDefault();
    const { id } = this.props;
    const {isRemoveFiles}  = this.state;
    document.getElementById('delete').style.display = 'none';
    return this.props.handleDelete(id, isRemoveFiles);
  }

  closeDeleteModel() {
    document.getElementById('delete').style.display = 'none';
  }

  render() {
    const { section, action, executions, entrypoint} = this.props;

    if (!action) {
      return null;
    }

    setTitle([ action.ref, 'Actions' ]);

    return (
      <PanelDetails data-test="details">
        <DetailsHeader
          title={( <Link to={`/actions/${action.ref}`}>{action.ref}</Link> )}
          subtitle={action.description}
        />
        <DetailsSwitch
          sections={[
            { label: 'Parameters', path: 'general' },
            { label: 'executions', path: 'executions' },
            { label: 'Code', path: 'code', className: [ 'icon-code', 'st2-details__switch-button' ] },
            { label: 'Entrypoint', path: 'entrypoint', className: [ 'icon-code2', 'st2-details__switch-button' ] },
          ]}
          current={section}
          onChange={({ path }) => this.handleSection(path)}
        />

        { section === 'general' ? (
          <DetailsBody>
            <DetailsToolbar key="toolbar">
              <Button  
                disabled={ 
                  (this.state.runValue && this.state.runValue.timeout && !this.isExpression(this.state.runValue.timeout) && 
                     (this.isValidInt(this.state.runValue.timeout) ||
                      this.minMax(this.state.runValue.timeout))) || 
                  (this.state.runValue && this.state.runValue.limit && !this.isExpression(this.state.runValue.limit) && 
                     (this.isValidInt(this.state.runValue.limit) ||
                      this.minMax(this.state.runValue.limit)))
                }
                value="Run" data-test="run_submit" onClick={(e) => this.handleRun(e, action.ref, this.state.runValue, this.state.runTrace || undefined)} 
              />
              <Button flat value="Preview" onClick={() => this.handleToggleRunPreview()} />
              <DetailsToolbarSeparator />
              <Button disabled={this.props.id !== action.ref} className="st2-forms__button st2-details__toolbar-button"  value="Clone" onClick={(e) => this.openModel(e)}   />
              <Button className="st2-forms__button st2-details__toolbar-button"  value="Delete" onClick={(e) => this.openDeleteModel(e)}  />

              { action.runner_type === 'mistral-v2' || action.runner_type === 'orquesta' ? (
                <Link
                  target="_blank"
                  to={`/action/${action.ref}`}
                  className="st2-forms__button st2-details__toolbar-button"
                  onClick={e => this.setWindowName(e)}
                >
                  Edit
                </Link>
              ) : null }
            </DetailsToolbar>
            { this.state.runPreview && <Highlight key="preview" well data-test="action_code" code={this.state.runValue} /> }
            <DetailsPanel key="panel" data-test="action_parameters">
              <DetailsPanelBody>
                <form>
                  <AutoForm
                    spec={{
                      type: 'object',
                      properties: action.parameters,
                    }}
                    data={this.state.runValue}
                    onChange={(runValue) => this.setState({ runValue })}
                  />
                  <StringField
                    name="trace-tag"
                    spec={{}}
                    value={this.state.runTrace}
                    onChange={(runTrace) => this.setState({ runTrace })}
                  />
                </form>
              </DetailsPanelBody>
            </DetailsPanel>
          </DetailsBody>
        ) : null }

        { section === 'code' ? (
          <DetailsBody>
            <DetailsPanel data-test="action_code">
              <Highlight code={action} type="action" id={action.ref} />
            </DetailsPanel>
          </DetailsBody>
        ) : null }

        { section === 'entrypoint' ? (
          <DetailsBody>
            <DetailsPanel data-test="action_entrypoint">
              <Highlight code={entrypoint} type="entrypoint" id={action.ref} />
            </DetailsPanel>
          </DetailsBody>
        ) : null }

        { section === 'executions' ? (
          // TODO: redo in the likeness of Trigger's InstancePanel
          <DetailsBody>
            <DetailsToolbar key="toolbar">
              <Link className="st2-forms__button st2-forms__button--flat" to={`/history?action=${action.ref}`}>
                <i className="icon-history" /> See full action history
              </Link>
            </DetailsToolbar>
            <DetailsPanel key="panel" stick data-test="action_executions">
              <DetailsPanelBody>
                { executions.length > 0 ? (
                  <FlexTable>
                    { executions.map((execution) => ([
                      <FlexTableRow
                        key={execution.id}
                        onClick={() => this.handleToggleExecution(execution.id)}
                        columns={[]}
                      >
                        <FlexTableColumn fixed>
                          <i className={this.state.executionsVisible[execution.id] ? 'icon-chevron-down' : 'icon-chevron_right'} />
                        </FlexTableColumn>
                        <FlexTableColumn fixed>
                          <Label status={execution.status} short={true} />
                        </FlexTableColumn>
                        <FlexTableColumn>
                          <Time timestamp={execution.start_timestamp} />
                        </FlexTableColumn>
                        <Link
                          to={`/history/${execution.id}/general?action=${action.ref}`}
                          className='st2-actions__details-column-history'
                          title='Jump to History'
                        >
                          <i className="icon-history" />
                        </Link>
                      </FlexTableRow>,
                      <FlexTableInsert key={`${execution.id}-insert`} visible={this.state.executionsVisible[execution.id] || false}>
                        <ActionReporter runner={execution.runner.name} execution={execution} />
                      </FlexTableInsert>,
                    ])) }
                  </FlexTable>
                ) : (
                  <DetailsPanelEmpty>No history records for this action</DetailsPanelEmpty>
                ) }
              </DetailsPanelBody>
            </DetailsPanel>
          </DetailsBody>
        ) : null }
        
        {/* Written pop-up box code here  */}
        <div id="overlay" className="web_dialog_overlay" style={{display: 'none', position: 'fixed', zIndex: '10', left: '0',top: '0',width: '100%', minHeight: '-webkit-fill-available', overflow: 'auto', backgroundColor: 'rgba(0,0,0,0.4)' }}> 
          <div id="dialog" className="web_dialog" style={{backgroundColor: '#fefefe' ,margin: '15% auto',padding: '20px', border: '1px solid #888' ,width: '28%' ,height:'50%' }}> 
            <EnumField name="Destination Pack Name *" value={this.state.destinationPack ? this.state.destinationPack : action.pack} spec={{enum: this.state.packs}}  onChange={(e) => this.handleDropdown(e)} /><br /><br />
            <StringField  style={{height:'30%'}} name="Destination Action Name *" value={this.state.destinationAction} onChange={(e) => this.handleInput(e)} required /><br /><br />

            <input id="checkbox" name="checkbox" type="checkbox" checked={this.state.isChecked} value={this.state.isChecked} onChange={(e) => this.handleChange(e)}  /> Overwrite <br /><br /><br />
            <span id="error" /><br /><br />
            <div style={{width:'100%', display:'inline-block'}}>
              <button  onClick={(e) => this.handleClone(e, action.pack,action.name,this.state.destinationAction,this.state.destinationPack, this.state.isChecked )}  type="submit" className="btn" style={{backgroundColor: '#04AA6D' , color: 'white',padding: '16px 20px' ,border: 'none', cursor: 'pointer', width: '45%' ,marginBottom:'10px' , opacity: '0.8',float:'left'}}>Submit</button>
              <button onClick={(e) => this.closeModel(e)} type="close" className="btn cancel" style={{backgroundColor: 'red' , color: 'white',padding: '16px 20px' ,border: 'none', cursor: 'pointer', width: '45%' ,marginBottom:'10px' , opacity: '0.8', float:'right'}}>Close</button>
            </div>
          </div>
        </div>

        <div id="delete" className="web_dialog_overlay" style={{display: 'none', position: 'fixed', zIndex: '10', left: '0',top: '0',width: '100%', minHeight: '-webkit-fill-available', overflow: 'auto', backgroundColor: 'rgba(0,0,0,0.4)' }}> 
          <div id="dialog" className="web_dialog" style={{backgroundColor: '#fefefe' ,margin: '15% auto',padding: '20px', border: '1px solid #888' ,width: '24%' ,height:'20%' }}>
            <p> You are about to delete the action. Are you sure? </p>
            <input id="deletecheckbox" name="checkbox" type="checkbox" checked={this.state.isRemoveFiles} value={this.state.isRemoveFiles} onChange={(e) => this.handleDeleteChange(e)} /> Remove Files (This operation is irreversible.) <br /><br /><br />
            <div style={{width:'100%', display:'inline-block'}}>
              <button  onClick={(e) => this.handleDelete(e)}  type="submit" className="btn" style={{backgroundColor: '#04AA6D' , color: 'white',padding: '16px 20px' ,border: 'none', cursor: 'pointer', width: '45%' ,marginBottom:'10px' , opacity: '0.8',float:'left'}}>Submit</button>
              <button onClick={(e) => this.closeDeleteModel(e)} type="close" className="btn cancel" style={{backgroundColor: 'red' , color: 'white',padding: '16px 20px' ,border: 'none', cursor: 'pointer', width: '45%' ,marginBottom:'10px' , opacity: '0.8', float:'right'}}>Close</button>
            </div>
          </div>
        </div>
      </PanelDetails>
    );
  }
}
