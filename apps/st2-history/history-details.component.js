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
import Button from '@stackstorm/module-forms/button.component';
import Highlight from '@stackstorm/module-highlight';
import Label from '@stackstorm/module-label';
import {
  PanelDetails,
  DetailsHeader,
  DetailsSwitch,
  DetailsBody,
  DetailsPanel,
  DetailsPanelHeading,
  DetailsPanelBody,
  DetailsPanelBodyLine,
  DetailsToolbar,
  DetailsToolbarSeparator,
} from '@stackstorm/module-panel';
import selectOnClick from '@stackstorm/module-select-on-click';
import Time from '@stackstorm/module-time';
import HistoryPopup from './history-popup.component';

@connect((state) => {
  const { execution } = state;
  return { execution };
})

export default class HistoryDetails extends React.Component {
  static propTypes = {
    handleNavigate: PropTypes.func.isRequired,
    handleRerun: PropTypes.func.isRequired,
    handleCancel: PropTypes.func.isRequired,

    id: PropTypes.string,
    section: PropTypes.string,
    execution: PropTypes.object, // eslint-disable-line react/no-unused-prop-types
    displayUTC: PropTypes.bool.isRequired,
    handleToggleUTC: PropTypes.func,
  }

  static defaultProps = {
    displayUTC: false,
  }

  componentDidMount() {
    const { id } = this.props;

    if (id) {
      this.fetchExecution(id);
    }
  }

  componentDidUpdate(prevProps) {
    const { id } = this.props;

    if (id && id !== prevProps.id) {
      this.fetchExecution(id);
    }
  }

  fetchExecution(id) {
    // We utilize ?max_result_size query parameter filter so we don't retrieve
    // large results which we don't render due to that being very slow and
    // freezing the browser window
    const maxResultSizeForRender = ActionReporter.utils.getMaxExecutionResultSizeForRender();
    const path = `/executions/${id}?max_result_size=${maxResultSizeForRender}`;

    store.dispatch({
      type: 'FETCH_EXECUTION',
      promise: api.request({ path: path }),
    })
      .catch((err) => {
        notification.error(`Unable to retrieve execution "${id}".`, { err });
        throw err;
      })
    ;
  }

  handleSection(section) {
    const { id } = this.props;
    return this.props.handleNavigate({ id, section });
  }

  render() {
    const { section, execution, displayUTC, handleToggleUTC } = this.props;
    
    let actionParameters; 
    if(execution) {
      actionParameters = {...execution.parameters };  
    } 
    
    if (!execution) {
      return null;
    }

    setTitle([ execution.action.ref, 'History' ]);
    
    return (
      <PanelDetails data-test="details">
        <DetailsHeader
          title={( <Link to={`/actions/${execution.action.ref}`}>{execution.action.ref}</Link> )}
          subtitle={execution.action.description}
        />
        <DetailsSwitch
          sections={[
            { label: 'General', path: 'general' },
            { label: 'Code', path: 'code', className: [ 'icon-code', 'st2-details__switch-button' ] },
          ]}
          current={section}
          onChange={({ path }) => this.handleSection(path)}
        />
        <DetailsToolbar>
          <Button value="Rerun" data-test="rerun_button" onClick={() => this.handleSection('rerun')} />
          <Button flat value="Cancel" onClick={() => this.props.handleCancel()} disabled={!execution || execution.status !== 'running'} />

          <DetailsToolbarSeparator />
        </DetailsToolbar>
        <DetailsBody>
          { section === 'general' ? (
            <div>
              <DetailsPanel>
                <DetailsPanelBody>
                  <DetailsPanelBodyLine label="Status">
                    <Label status={execution.status} data-test="status" />
                  </DetailsPanelBodyLine>
                  <DetailsPanelBodyLine label="Execution ID">
                    <div className="st2-history__uuid" ref={selectOnClick} data-test="execution_id">
                      { execution.id }
                    </div>
                  </DetailsPanelBodyLine>
                  { execution.context && execution.context.trace_context && execution.context.trace_context.trace_tag ? (
                    <DetailsPanelBodyLine label="Trace Tag">
                      <div className="st2-history__uuid" ref={selectOnClick}>
                        { execution.context.trace_context.trace_tag }
                      </div>
                    </DetailsPanelBodyLine>
                  ) : null
                  }
                  { execution.start_timestamp ? (
                    <DetailsPanelBodyLine label="Started">
                      <Time
                        timestamp={execution.start_timestamp}
                        format="ddd, DD MMM YYYY HH:mm:ss"
                        utc={displayUTC}
                        onClick={handleToggleUTC}
                        data-test="start_timestamp"
                      />
                    </DetailsPanelBodyLine>
                  ) : null }
                  { execution.end_timestamp ? (
                    <DetailsPanelBodyLine label="Finished">
                      <Time
                        timestamp={execution.end_timestamp}
                        format="ddd, DD MMM YYYY HH:mm:ss"
                        utc={displayUTC}
                        onClick={handleToggleUTC}
                        data-test="end_timestamp"
                      />
                    </DetailsPanelBodyLine>
                  ) : null }
                  { execution.end_timestamp ? (
                    <DetailsPanelBodyLine label="Execution Time">
                      <span data-test="execution_time">
                        {getExecutionTime(execution)}s
                      </span>
                    </DetailsPanelBodyLine>
                  ) : null }
                </DetailsPanelBody>
                <DetailsPanelHeading title="Action Output">
                  <Link to={`/code/live/${execution.id}`} className="st2-history__live-link">
                    check live output
                  </Link>
                </DetailsPanelHeading>
                <DetailsPanelBody data-test="action_output">
                  <ActionReporter runner={execution.runner.name} execution={execution} api={api} />
                </DetailsPanelBody>
              </DetailsPanel>
              { execution.rule ? (
                <DetailsPanel>
                  <DetailsPanelHeading title="Rule Details" />
                  <DetailsPanelBody>
                    <DetailsPanelBodyLine label="Rule">
                      <Link to={`/rules/${execution.rule.ref}/general`}>{execution.rule.ref}</Link>
                    </DetailsPanelBodyLine>
                    { execution.rule.description ?
                      (
                        <DetailsPanelBodyLine label="Description">
                          { execution.rule.description }
                        </DetailsPanelBodyLine>
                      )
                      : null }
                  </DetailsPanelBody>
                </DetailsPanel>
              ) : null }
              { execution.trigger ? (
                <DetailsPanel>
                  <DetailsPanelHeading title="Trigger Details" />
                  <DetailsPanelBody>
                    { execution.trigger.type ? (
                      <DetailsPanelBodyLine label="Trigger">
                        <Link to={`/triggers/${execution.trigger.type}`}>{execution.trigger.type}</Link>
                      </DetailsPanelBodyLine>
                    ) : null }
                    { execution.trigger_instance && execution.trigger_instance.occurrence_time ? (
                      <DetailsPanelBodyLine label="Occurrence">
                        <Time
                          timestamp={execution.trigger_instance.occurrence_time}
                          format="ddd, DD MMM YYYY HH:mm:ss"
                          utc={displayUTC}
                          onClick={handleToggleUTC}
                        />
                      </DetailsPanelBodyLine>
                    ) : null }
                  </DetailsPanelBody>
                  { execution.trigger_instance && execution.trigger_instance.occurrence_time ? (
                    <DetailsPanelBody>
                      <Highlight code={execution.trigger_instance.payload} lines={10} type="trigger_instance" id={execution.trigger_instance.id} well />
                    </DetailsPanelBody>
                  ) : null }
                </DetailsPanel>
              ) : null }
              <DetailsPanel data-test="action_input">
                <DetailsPanelHeading title="Action Input" />
                <DetailsPanelBody>
                  { execution.parameters ? (
                    <form className="st2-details__form">
                      <AutoForm
                        spec={{
                          type: 'object',
                          properties: {
                            ...execution.runner.runner_parameters,
                            ...execution.action.parameters,
                          },
                        }}
                        disabled={true}
                        data={execution.parameters}
                      />
                    </form>
                  ) : 'No Input' }
                </DetailsPanelBody>
              </DetailsPanel>
            </div>
          ) : null }
          { section === 'code' ? (
            <DetailsPanel data-test="execution_code">
              <Highlight code={execution} type="execution" id={execution.id} />
            </DetailsPanel>
          ) : null }
        </DetailsBody>

        { section === 'rerun' ? (
          <HistoryPopup
            action={execution.action.ref}
            payload={actionParameters}
            spec={{
              type: 'object',
              properties: {
                ...execution.runner.runner_parameters,
                ...execution.action.parameters,
              },
            }}

            onSubmit={(data) => this.props.handleRerun(data)}
            onCancel={() => this.handleSection('general')}
          />
        ) : null }
      </PanelDetails>
    );
  }
}

function getExecutionTime(execution) {
  return Math.ceil(
    (new Date(execution.end_timestamp).getTime() - new Date(execution.start_timestamp).getTime()) / 1000
  );
}
