import React from 'react';
import { PropTypes } from 'prop-types';
import store from './store';

import api from '@stackstorm/module-api';
import notification from '@stackstorm/module-notification';
import setTitle from '@stackstorm/module-title';

import { Link } from 'react-router-dom';
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
  DetailsToolbar,
  DetailsToolbarSeparator,
} from '@stackstorm/module-panel';
import AutoForm from '@stackstorm/module-auto-form';

export default class TriggersDetails extends React.Component {
  static propTypes = {
    handleNavigate: PropTypes.func.isRequired,

    section: PropTypes.string,
    trigger: PropTypes.object,
    sensor: PropTypes.object,
  }

  handleSection(section) {
    const id = this.props.trigger.ref;
    return this.props.handleNavigate({ id, section });
  }

  handleToggleEnable(sensor) {
    return store.dispatch({
      type: 'TOGGLE_ENABLE',
      promise: api.client.index.request({ method: 'put', path: `/sensortypes/${sensor.ref}`}, { ...sensor, enabled: !sensor.enabled }).then(res => res.data),
    })
      .catch((err) => {
        notification.error(`Unable to retrieve sensor "${sensor.ref}".`, { err });
        throw err;
      })
    ;
  }

  render() {
    const { section, trigger, sensor } = this.props;

    if (!trigger) {
      return null;
    }
    
    setTitle([ trigger.ref, 'Trigger Types' ]);

    return (
      <PanelDetails data-test="details">
        <DetailsHeader
          status={trigger.enabled ? 'enabled' : 'disabled'}
          title={( <Link to={`/triggers/${trigger.ref}`}>{trigger.ref}</Link> )}
          subtitle={trigger.description}
        />
        <DetailsSwitch
          sections={[
            { label: 'General', path: 'general' },
            { label: 'Code', path: 'code' },
          ]}
          current={section}
          onChange={({ path }) => this.handleSection(path)}
        />
        <DetailsToolbar>
          { sensor
            ? <Toggle title="enabled" value={sensor.enabled} onChange={() => this.handleToggleEnable(sensor)} />
            : <Toggle title="no sensor" value={false} disabled />
          }
          <DetailsToolbarSeparator />
        </DetailsToolbar>
        <DetailsBody>
          { section === 'general' ? (
            <form name="form">
              <DetailsPanel>
                <DetailsPanelHeading title="Parameters" />
                <DetailsPanelBody>
                  <AutoForm
                    spec={{
                      type: 'object',
                      properties: {
                        name: {
                          type: 'string',
                        },
                        description: {
                          type: 'string',
                        },
                      },
                    }}
                    data={trigger}
                    disabled
                    data-test="parameters_form"
                    flat
                  />
                </DetailsPanelBody>
              </DetailsPanel>
            </form>
          ) : null }
          { section === 'code' ? (
            <DetailsPanel data-test="trigger_code">
              <Highlight lines={20} code={trigger} />
            </DetailsPanel>
          ) : null }
        </DetailsBody>
      </PanelDetails>
    );
  }
}
