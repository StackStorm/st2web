import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

import api from '@stackstorm/module-api';
import setTitle from '@stackstorm/module-title';
import notification from '@stackstorm/module-notification';

import AutoForm from '@stackstorm/module-auto-form';
import RemoteForm from '@stackstorm/module-remote-form';
import Button from '@stackstorm/module-forms/button.component';
import Criteria from '@stackstorm/module-criteria';

import AutoFormCheckbox from '@stackstorm/module-auto-form/modules/checkbox';
import AutoFormCombobox from '@stackstorm/module-auto-form/modules/combobox';

import {
  DetailsPanel,
  DetailsPanelBody,
  DetailsButtonsPanel,
} from '@stackstorm/module-panel';

import Popup from '@stackstorm/module-popup';

@connect(
  ({
    triggerSpec, criteriaSpecs, actionSpec, packSpec,
  }) => ({
    triggerSpec, criteriaSpecs, actionSpec, packSpec,
  }),
  (dispatch, props) => ({
    onSubmit: (rule) => dispatch({
      type: 'CREATE_RULE',
      promise: api.request({
        method: 'post',
        path: '/rules',
      }, rule)
        .then((rule) => {
          notification.success(`Rule "${rule.ref}" has been created successfully.`);

          props.onNavigate({
            id: rule.ref,
            section: 'general',
          });

          return rule;
        })
        .catch((err) => {
          notification.error('Unable to create rule.', { err });
          throw err;
        }),
    }),
    onCancel: () => props.navigate({ id: false }),
  })
)
export default class RulesPopup extends React.Component {
  static propTypes = {
    triggerSpec: PropTypes.object,
    criteriaSpecs: PropTypes.object,
    actionSpec: PropTypes.object,
    packSpec: PropTypes.object,

    onSubmit: PropTypes.func,
    onCancel: PropTypes.func,
  }

  state = {
    payload: {
      pack: '',
      enabled: true,
      trigger: {
        type: '',
        parameters: {},
      },
      criteria: {},
      action: {
        ref: '',
        parameters: {},
      },
    },
  }

  cacheMethod(key, method) {
    this.methodCache = this.methodCache || {};
    if (!this.methodCache[key]) {
      this.methodCache[key] = method;
    }

    return this.methodCache[key];
  }

  handleChange(path, value) {
    if (!path) {
      return this.setState({
        payload: {
          ...this.state.payload,
          ...value,
        },
      });
    }

    let source = this.state.payload;
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

    return this.setState({ payload: target });
  }

  handleSubmit(e) {
    e.preventDefault();

    this.props.onSubmit(this.state.payload);
  }

  render() {
    const { triggerSpec, criteriaSpecs, actionSpec, packSpec, onCancel } = this.props;
    const payload = this.state.payload;

    setTitle([ 'Create', 'Rules' ]);

    return (
      <div className="st2-rerun">
        <Popup title="Create a rule" onCancel={() => onCancel()} data-test="rule_create_popup">
          <form>
            <DetailsPanel>
              <DetailsPanelBody>
                <AutoForm
                  spec={{
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        required: true,
                        pattern: '^[\\w.-]+$',
                      },
                      description: {
                        type: 'string',
                      },
                    },
                  }}
                  data={payload}
                  onChange={(meta) => this.handleChange(null, meta)}
                />

                <AutoFormCombobox
                  name="pack"
                  spec={packSpec}
                  data={payload.pack}
                  onChange={(pack) => this.handleChange('pack', pack)}
                />

                <AutoFormCheckbox
                  name="enabled"
                  spec={{
                    name: 'enabled',
                    type: 'boolean',
                    default: true,
                  }}
                  data={payload.enabled}
                  onChange={(enabled) => this.handleChange('enabled', enabled)}
                />
              </DetailsPanelBody>
            </DetailsPanel>

            <DetailsPanel title="Trigger">
              <DetailsPanelBody>
                <RemoteForm
                  name="trigger"
                  spec={triggerSpec}
                  data={payload.trigger}
                  onChange={(trigger) => this.handleChange('trigger', trigger)}
                  data-test="rule_create_trigger_form"
                />
              </DetailsPanelBody>
            </DetailsPanel>

            <DetailsPanel title="Criteria">
              <DetailsPanelBody>
                <Criteria
                  spec={criteriaSpecs[payload.trigger.type]}
                  data={payload.criteria}
                  onChange={(criteria) => this.handleChange('criteria', criteria)}
                />
              </DetailsPanelBody>
            </DetailsPanel>

            <DetailsPanel title="Action">
              <DetailsPanelBody>
                <RemoteForm
                  name="action"
                  spec={actionSpec}
                  data={payload.action}
                  onChange={(action) => this.handleChange('action', action)}
                  data-test="rule_create_action_form"
                />
              </DetailsPanelBody>
            </DetailsPanel>

            <DetailsPanel>
              <DetailsButtonsPanel>
                <Button
                  flat red
                  className="st2-details__toolbar-button"
                  onClick={() => onCancel()}
                  value="Cancel"
                />
                <Button
                  submit
                  className="st2-details__toolbar-button"
                  value="Create"
                  onClick={(e) => this.handleSubmit(e)}
                  data-test="rule_create_submit"
                />
              </DetailsButtonsPanel>
            </DetailsPanel>
          </form>
        </Popup>
      </div>
    );
  }
}
