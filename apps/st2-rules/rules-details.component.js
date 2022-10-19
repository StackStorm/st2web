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

import api from '@stackstorm/module-api';
import notification from '@stackstorm/module-notification';
import setTitle from '@stackstorm/module-title';

import { Link } from '@stackstorm/module-router';
import Criteria from '@stackstorm/module-criteria';
import Button, { Toggle } from '@stackstorm/module-forms/button.component';
import Highlight from '@stackstorm/module-highlight';
import PackIcon from '@stackstorm/module-pack-icon';
import {
  PanelDetails,
  DetailsHeader,
  DetailsSwitch,
  DetailsBody,
  DetailsLine,
  DetailsFormLine,
  DetailsCriteriaLine,
  DetailsLineNote,
  DetailsPanel,
  DetailsPanelHeading,
  DetailsPanelBody,
  DetailsToolbar,
  DetailsToolbarSeparator,
} from '@stackstorm/module-panel';
import RemoteForm from '@stackstorm/module-remote-form';
import EnforcementPanel from './panels/enforcements';

@connect(
  ({
    rule,

    enforcements,

    triggerParameters,
    actionParameters,

    triggerSpec,
    criteriaSpecs,
    actionSpec,
    packSpec,
  }, props) => ({
    rule,

    enforcements,

    triggerParameters,
    actionParameters,

    triggerSpec,
    criteriaSpecs,
    actionSpec,
    packSpec,
  }),
  (dispatch, props) => ({
    onComponentUpdate: () => props.id && Promise.all([
      dispatch({
        type: 'FETCH_RULE',
        promise: api.request({
          path: `/rules/views/${props.id}`,
        })
          .catch((err) => {
            notification.error(`Unable to retrieve the rule "${props.id}".`, { err });
            throw err;
          }),
      }),
      dispatch({
        type: 'FETCH_ENFORCEMENTS',
        promise: api.request({ path: '/ruleenforcements/views', query: {
          rule_ref: props.id,
          limit: 10,
        }})
          .catch((err) => {
            notification.error(`Unable to retrieve enforcements for "${props.id}".`, { err });
            throw err;
          }),
      }),
    ]),
    onSave: (rule) => dispatch({
      type: 'EDIT_RULE',
      promise: api.request({
        method: 'put',
        path: `/rules/${rule.id}`,
      }, rule)
        .then((rule) => {
          notification.success(`Rule "${rule.ref}" has been saved successfully.`);

          props.onNavigate({
            id: rule.ref,
            section: 'general',
          });

          return rule;
        })
        .catch((err) => {
          notification.error(`Unable to save rule "${rule.ref}".`, { err });
          throw err;
        })
        .then((rule) => api.request({
          path: `/rules/views/${rule.ref}`,
        }))
        .catch((err) => {
          notification.error(`Unable to retrieve the rule "${rule.ref}".`, { err });
          throw err;
        }),
    }),
    onDelete: (ref) => dispatch({
      type: 'DELETE_RULE',
      ref,
      promise: api.request({
        method: 'delete',
        path: `/rules/${ref}`,
      })
        .then((res) => {
          notification.success(`Rule "${ref}" has been deleted successfully.`);

          props.onNavigate({ id: null });

          return res;
        })
        .catch((err) => {
          notification.error(`Unable to delete rule "${ref}".`, { err });
          throw err;
        }),
    }),
    onToggleEnable: (rule) => dispatch({
      type: 'TOGGLE_ENABLE',
      promise: api.request({
        method: 'put',
        path: `/rules/${rule.id}`,
      }, { 
        ...rule, 
        enabled: !rule.enabled,
      }),
    })
      .catch((err) => {
        notification.error(`Unable to update rule "${rule.ref}".`, { err });
        throw err;
      }),
  }),
  (state, dispatch, props) => ({
    ...props,
    ...state,
    ...dispatch,
    onSave: (rule) => dispatch.onSave(rule),
    onDelete: () => dispatch.onDelete(props.id),
    onToggleEnable: () => dispatch.onToggleEnable(state.rule),
  })
)
export default class RulesDetails extends React.Component {
  static propTypes = {
    onComponentUpdate: PropTypes.func,

    onNavigate: PropTypes.func.isRequired,
    onSave: PropTypes.func,
    onDelete: PropTypes.func,
    onToggleEnable: PropTypes.func,

    id: PropTypes.string,
    section: PropTypes.string,
    rule: PropTypes.object,

    triggerParameters: PropTypes.object,
    actionParameters: PropTypes.object,

    enforcements: PropTypes.array,

    triggerSpec: PropTypes.object,
    criteriaSpecs: PropTypes.object,
    actionSpec: PropTypes.object,
    packSpec: PropTypes.object,
  }

  state = {
    editing: null,
    rulePreview: false,
  }

  componentDidMount() {
    this.props.onComponentUpdate && this.props.onComponentUpdate();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id === this.props.id) {
      return;
    }

    if (this.props.id === 'new') {
      return;
    }

    this.props.onComponentUpdate && this.props.onComponentUpdate();

    this.setState({ editing: null });
  }

  handleSection(section) {
    const { rule } = this.props;
    return this.props.onNavigate({ id: rule.ref, section });
  }

  handleChange(path, value) {
    if (!path) {
      return this.setState({ editing: {
        ...this.state.editing,
        ...value,
      } });
    }

    let source = this.state.editing;
    const target = { ...source };
    let current = target;

    const keys = path.split('.');
    const final = keys.pop();
    for (const key of keys) {
      if (source[key] && Array.isArray(source[key])) {
        current[key] = [ ...source[key] ];
      }
      else if (source[key] && typeof source[key] === 'object') {
        current[key] = { ...source[key] };
      }
      else {
        current[key] = {};
      }

      source = source[key];
      current = current[key];
    }

    current[final] = value;

    return this.setState({ editing: target });
  }

  handleEdit(e) {
    e && e.preventDefault();
    this.setState({ editing: this.props.rule });
  }

  handleCancel(e) {
    e && e.preventDefault();
    this.setState({ editing: null, rulePreview: false });
  }

  handleSave(e) {
    e && e.preventDefault();

    return this.props.onSave(this.state.editing)
      .then(() => {
        this.setState({ editing: null, rulePreview: false });
      });
  }

  handleDelete(e) {
    e && e.preventDefault();

    if (!window.confirm(`Do you really want to delete rule "${this.props.rule.ref}"?`)) {
      return undefined;
    }

    return this.props.onDelete();
  }

  handleToggleEnable(rule) {
    return this.props.onToggleEnable();
  }

  handleToggleRunPreview() {
    let { rulePreview } = this.state;

    rulePreview = !rulePreview;

    this.setState({ rulePreview });
  }

  render() {
    const {
      section,
      enforcements, 
      triggerParameters, 
      actionParameters, 
      triggerSpec, 
      criteriaSpecs, 
      actionSpec, 
      packSpec,
    } = this.props;

    const rule = this.state.editing || this.props.rule;

    if (!rule || !triggerParameters || !actionParameters) {
      return false;
    }

    const trigger = triggerParameters[rule.trigger.type];
    const action = actionParameters[rule.action.ref];

    setTitle([ rule.ref, 'Rules' ]);

    return (
      <PanelDetails data-test="details">
        <DetailsHeader
          status={rule.enabled ? 'enabled' : 'disabled'}
          title={( <Link to={`/rules/${rule.ref}`}>{rule.ref}</Link> )}
          subtitle={rule.description}
        />
        <DetailsSwitch
          sections={[
            { label: 'General', path: 'general' },
            { label: 'Enforcements', path: 'enforcements' },
            { label: 'Code', path: 'code', className: [ 'icon-code', 'st2-details__switch-button' ] },
          ]}
          current={section}
          onChange={({ path }) => this.handleSection(path)}
        />
        <DetailsToolbar>
          <Toggle title="enabled" value={rule.enabled} onChange={() => this.handleToggleEnable(rule)} />
          { this.state.editing ? [
            <Button key="save" value="Save" onClick={() => this.handleSave()} data-test="save_button" />,
            <Button flat red key="cancel" value="Cancel" onClick={() => this.handleCancel()} data-test="cancel_button" />,
            <Button flat key="preview" value="Preview" onClick={() => this.handleToggleRunPreview()} />,
          ] : [
            <Button flat key="edit" value="Edit" onClick={() => this.handleEdit()} data-test="edit_button" />,
            <Button flat red key="delete" value="Delete" onClick={() => this.handleDelete()} data-test="delete_button" />,
          ] }
          <DetailsToolbarSeparator />
        </DetailsToolbar>
        { this.state.rulePreview && <Highlight key="preview" well data-test="rule_preview" code={rule} /> }
        <div className="st2-rules__conditions">
          <div className="st2-rules__condition-if" data-test="condition_if">
            <div className="st2-rules__column-trigger" title={rule.trigger.type}>
              <span className="st2-rules__label">If</span>
              <PackIcon className="st2-rules__condition-icon" name={rule && rule.trigger.type.split('.')[0]} />

              <span className="st2-rules__name">
                { rule.trigger.type }
              </span>
              { rule.trigger.description ? (
                <span className="st2-rules__description">
                  { rule.trigger.description }
                </span>
              ) : null }
            </div>
          </div>
          <div className="st2-rules__condition-then" data-test="condition_then">
            <div className="st2-rules__column-action" title={rule.action.ref}>
              <span className="st2-rules__label">Then</span>
              <PackIcon className="st2-rules__condition-icon" name={rule && rule.action.ref.split('.')[0]} />

              <span className="st2-rules__name">
                { rule.action.ref }
              </span>
              <span className="st2-rules__description">
                { rule.action.description }
              </span>
            </div>
          </div>
        </div>
        <DetailsBody>
          { section === 'general' ? (
            !this.state.editing ? (
              <div>
                <DetailsPanel>
                  <DetailsPanelHeading title="Trigger" />
                  <DetailsPanelBody>
                    <Link to={`/triggers/${rule.trigger.type}`}>{rule.trigger.type}</Link>
                    {
                      trigger
                        ? (
                          trigger
                            .map(({ name, default:def }) => {
                              const value = rule.trigger.parameters[name] !== undefined ? rule.trigger.parameters[name] : def;
    
                              if (value === undefined) {
                                return false;
                              }
    
                              return <DetailsFormLine key={name} name={name} value={value} />;
                            })
                        ) : (
                          <div>
                            Trigger is missing
                          </div>
                        )
                        
                    }
                  </DetailsPanelBody>
                </DetailsPanel>
                <DetailsPanel>
                  <DetailsPanelHeading title="Action" />
                  <DetailsPanelBody>
                    <Link to={`/actions/${rule.action.ref}`}>{rule.action.ref}</Link>
                    {
                      action 
                        ? (
                          action
                            .map(({ name, default:def }) => {
                              const value = rule.action.parameters[name] !== undefined ? rule.action.parameters[name] : def;

                              if (value === undefined) {
                                return false;
                              }

                              return <DetailsFormLine key={name} name={name} value={value} />;
                            })
                        ) : (
                          <DetailsLineNote>
                            Action has not been installed
                          </DetailsLineNote>
                        )
                    }
                  </DetailsPanelBody>
                </DetailsPanel>
                <DetailsPanel>
                  <DetailsPanelHeading title="Rule" />
                  <DetailsPanelBody>
                    <DetailsLine name="pack" value={<Link to={`/packs/${rule.pack}`}>{rule.pack}</Link>} />
                  </DetailsPanelBody>
                </DetailsPanel>
                <DetailsPanel>
                  <DetailsPanelHeading title="Criteria" />
                  <DetailsPanelBody>
                    {
                      Object.keys(rule.criteria || {}).length
                        ? (
                          Object.keys(rule.criteria || {})
                            .map(name => {
                              const { type, pattern, condition } = rule.criteria[name];
                              return <DetailsCriteriaLine key={`${name}//${type}//${pattern}`} name={name} type={type} pattern={pattern} condition={condition} />;
                            })
                        ) : (
                          <DetailsLineNote>
                            No criteria defined for this rule
                          </DetailsLineNote>
                        )
                    }
                  </DetailsPanelBody>
                </DetailsPanel>
              </div>
            ) : (
              <form name="form">
                { triggerSpec ? (
                  <DetailsPanel>
                    <DetailsPanelHeading title="Trigger" />
                    <DetailsPanelBody>
                      <RemoteForm
                        name="trigger"
                        disabled={!this.state.editing}
                        spec={triggerSpec}
                        data={rule.trigger}
                        onChange={(trigger) => this.handleChange('trigger', trigger)}
                        data-test="rule_trigger_form"
                      />
                    </DetailsPanelBody>
                  </DetailsPanel>
                ) : null }
                { criteriaSpecs ? (
                  <DetailsPanel>
                    <DetailsPanelHeading title="Criteria" />
                    <DetailsPanelBody>
                      <Criteria
                        disabled={!this.state.editing}
                        data={rule.criteria}
                        spec={criteriaSpecs[rule.trigger.type]}
                        onChange={(criteria) => this.handleChange('criteria', criteria)}
                        data-test="rule_criteria_form"
                      />
                    </DetailsPanelBody>
                  </DetailsPanel>
                ) : null }
                { actionSpec ? (
                  <DetailsPanel>
                    <DetailsPanelHeading title="Action" />
                    <DetailsPanelBody>
                      <RemoteForm
                        name="action"
                        disabled={!this.state.editing}
                        spec={actionSpec}
                        data={rule.action}
                        onChange={(action) => this.handleChange('action', action)}
                        data-test="rule_action_form"
                      />
                    </DetailsPanelBody>
                  </DetailsPanel>
                ) : null }
                { packSpec ? (
                  <DetailsPanel>
                    <DetailsPanelHeading title="Rule" />
                    <DetailsPanelBody>
                      <RemoteForm
                        name="pack"
                        disabled={!this.state.editing}
                        spec={packSpec}
                        data={{ pack: rule.pack, parameters: rule }}
                        onChange={({ pack, parameters: rule }) =>
                          pack === rule.pack
                            ? this.handleChange(null, rule)
                            : this.handleChange('pack', pack)
                        }
                        data-test="rule_pack_form"
                      />
                    </DetailsPanelBody>
                  </DetailsPanel>
                ) : null }
              </form>
            )
          ) : null }
          { section === 'code' ? (
            <DetailsPanel data-test="rule_code">
              <Highlight code={rule} type="rule" id={rule.id} />
            </DetailsPanel>
          ) : null }
          { section === 'enforcements' ? (
            <EnforcementPanel enforcements={enforcements} data-test="rule_enforcements" />
          ) : null }
        </DetailsBody>
      </PanelDetails>
    );
  }
}
