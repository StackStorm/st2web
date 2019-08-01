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

import get from 'lodash/fp/get';
import map from 'lodash/fp/map';
import flow from 'lodash/fp/flow';
import toPairs from 'lodash/fp/toPairs';

import api from '@stackstorm/module-api';
import notification from '@stackstorm/module-notification';
import setTitle from '@stackstorm/module-title';

import { Link } from '@stackstorm/module-router';
import { Toggle } from '@stackstorm/module-forms/button.component';
import Highlight from '@stackstorm/module-highlight';
import {
  PanelDetails,
  DetailsHeader,
  DetailsSwitch,
  DetailsBody,
  DetailsPanel,
  DetailsPanelHeading,
  DetailsPanelBody,
  DetailsLine,
  DetailsLineNote,
} from '@stackstorm/module-panel';
import InstancePanel from './panels/instances';

@connect(
  ({
    instances,
    triggers,
    sensors,
  }, props) => ({
    trigger: triggers.find(trigger => props.id === trigger.ref),
    sensor: sensors[props.id],
    instances,
  }),
  (dispatch, props) => ({
    onComponentUpdate: () => dispatch({
      type: 'FETCH_INSTANCES',
      promise: api.request({ path: '/triggerinstances', query: {
        trigger_type: props.id,
        limit: 10,
      } }),
    }),
    onToggleEnable: (sensor) => dispatch({
      type: 'TOGGLE_ENABLE',
      promise: api.request({ method: 'put', path: `/sensortypes/${sensor.ref}`}, { ...sensor, enabled: !sensor.enabled }),
    }).catch((err) => {
      notification.error(`Unable to retrieve sensor "${sensor.ref}".`, { err });
      throw err;
    }),
  }),
  (state, dispatch, props) => ({
    ...props,
    ...state,
    ...dispatch,
    onSelect: () => dispatch.onSelect(state.trigger),
    onToggleEnable: () => dispatch.onToggleEnable(state.sensor),
  })
)
export default class TriggersDetails extends React.Component {
  static propTypes = {
    handleNavigate: PropTypes.func.isRequired,

    id: PropTypes.string,
    section: PropTypes.string,
    trigger: PropTypes.object,
    sensor: PropTypes.object,
    instances: PropTypes.array,

    onComponentUpdate: PropTypes.func,
    onToggleEnable: PropTypes.func,
  }

  componentDidMount() {
    this.props.onComponentUpdate && this.props.onComponentUpdate();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id === this.props.id) {
      return;
    }

    this.props.onComponentUpdate && this.props.onComponentUpdate();
  }

  handleSection(section) {
    const id = this.props.trigger.ref;
    return this.props.handleNavigate({ id, section });
  }

  handleToggleEnable() {
    return this.props.onToggleEnable();
  }

  render() {
    const { section, trigger, sensor, instances } = this.props;

    if (!trigger) {
      return null;
    }

    const parameters = flow([
      get('parameters_schema.properties'),
      toPairs,
      map(([ key, value ]) => {
        return <DetailsLine key={key} name={key} value={get('description')(value) || ''} />;
      }),
    ])(trigger);

    const payload = flow([
      get('payload_schema.properties'),
      toPairs,
      map(([ key, value ]) => {
        return <DetailsLine key={key} name={key} value={get('description')(value) || ''} />;
      }),
    ])(trigger);

    setTitle([ trigger.ref, 'Trigger Types' ]);

    return (
      <PanelDetails data-test="details">
        <DetailsHeader
          title={( <Link to={`/triggers/${trigger.ref}`}>{trigger.ref}</Link> )}
          subtitle={trigger.description}
          {...(sensor && { status: sensor.enabled ? 'enabled' : 'disabled' })}
        />
        <DetailsSwitch
          sections={[
            { label: 'General', path: 'general' },
            { label: 'Instances', path: 'instances' },
            { label: 'Code', path: 'code', className: [ 'icon-code', 'st2-details__switch-button' ] },
          ]}
          current={section}
          onChange={({ path }) => this.handleSection(path)}
        />
        <DetailsBody>
          { section === 'general' ? (
            <form name="form">
              { sensor ? (
                <DetailsPanel>
                  <DetailsPanelHeading title="Sensor" />
                  <DetailsPanelBody>
                    <DetailsLine name="ref" value={sensor.ref} />
                    <Toggle title="enabled" value={sensor.enabled} onChange={() => this.handleToggleEnable(sensor)} />
                  </DetailsPanelBody>
                </DetailsPanel>
              ) : null }
              <DetailsPanel>
                <DetailsPanelHeading title="Parameters" />
                <DetailsPanelBody>
                  { parameters.length > 0 ? (
                    parameters
                  ) : (
                    <DetailsLineNote>
                      Trigger type does not have any parameters
                    </DetailsLineNote>
                  ) }
                </DetailsPanelBody>
              </DetailsPanel>
              <DetailsPanel>
                <DetailsPanelHeading title="Payload" />
                <DetailsPanelBody>
                  { payload.length > 0 ? (
                    payload
                  ) : (
                    <DetailsLineNote>
                      Trigger type does not have any payload
                    </DetailsLineNote>
                  ) }
                </DetailsPanelBody>
              </DetailsPanel>
            </form>
          ) : null }
          { section === 'code' ? (
            <DetailsPanel data-test="trigger_code">
              <Highlight code={trigger} type="trigger_type" id={trigger.ref} />
            </DetailsPanel>
          ) : null }
          { section === 'instances' ? (
            <InstancePanel instances={instances} key="panel" data-test="trigger_instances" />
          ) : null }
        </DetailsBody>
      </PanelDetails>
    );
  }
}
