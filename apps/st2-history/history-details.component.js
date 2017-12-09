import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

import { Link } from 'react-router-dom';

import store from './store';
import api from '@stackstorm/module-api';

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
import Button from '@stackstorm/module-forms/button.component';
import AutoForm from '@stackstorm/module-auto-form';
import St2Highlight from '@stackstorm/module-highlight';
import Time from '@stackstorm/module-time';
import Label from '@stackstorm/module-label';
import ActionReporter from '@stackstorm/module-action-reporter';
import selectOnClick from '@stackstorm/module-select-on-click';

import HistoryPopup from './history-popup.component';

@connect((state) => {
  const { execution } = state;
  return { execution };
})
export default class HistoryDetails extends React.Component {
  static propTypes = {
    handleNavigate: PropTypes.func.isRequired,
    handleRerun: PropTypes.func.isRequired,
    provideRefresh: PropTypes.func.isRequired,

    id: PropTypes.string,
    section: PropTypes.string,
    execution: PropTypes.object,
  }

  componentDidMount() {
    const { id, provideRefresh } = this.props;

    if (provideRefresh) {
      provideRefresh(() => this.refresh());
    }

    if (id) {
      store.dispatch({
        type: 'FETCH_EXECUTION',
        promise: api.client.executions.get(id),
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    const { id } = nextProps;

    if (id && id !== this.props.id) {
      store.dispatch({
        type: 'FETCH_EXECUTION',
        promise: api.client.executions.get(id),
      });
    }
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.id !== this.props.id) {
      return false;
    }

    return true;
  }

  refresh() {
    const { id } = this.props;

    store.dispatch({
      type: 'FETCH_EXECUTION',
      promise: api.client.executions.get(id),
    });
  }

  handleSection(section) {
    return this.props.handleNavigate({ section });
  }

  render() {
    const { section, execution } = this.props;

    if (!execution) {
      return null;
    }

    return (
      <PanelDetails data-test="details">
        <DetailsHeader title={execution.action.ref} subtitle={execution.action.description} />
        <DetailsSwitch
          sections={[
            { label: 'General', path: 'general' },
            { label: 'Code', path: 'code' },
          ]}
          current={section}
          onChange={({ path }) => this.handleSection(path)}
        />
        <DetailsBody>
          { section === 'general' ? (
            <div>
              <DetailsPanel>
                <div className="st2-action-reporter__header">
                  <DetailsPanelBody>
                    <DetailsPanelBodyLine label="Status">
                      <Label status={execution.status} data-test="status" />
                    </DetailsPanelBodyLine>
                    <DetailsPanelBodyLine label="Execution ID">
                      <div className="st2-action-reporter__uuid" ref={selectOnClick} data-test="execution_id">
                        { execution.id }
                      </div>
                    </DetailsPanelBodyLine>
                    { execution.context && execution.context.trace_context && execution.context.trace_context.trace_tag ? (
                      <DetailsPanelBodyLine label="Trace Tag">
                        <div className="st2-action-reporter__uuid" ref={selectOnClick}>
                          { execution.context.trace_context.trace_tag }
                        </div>
                      </DetailsPanelBodyLine>
                    ) : null
                    }
                    <DetailsPanelBodyLine label="Started">
                      <Time
                        timestamp={execution.start_timestamp}
                        format="ddd, DD MMM YYYY HH:mm:ss"
                        data-test="start_timestamp"
                      />
                    </DetailsPanelBodyLine>
                    <DetailsPanelBodyLine label="Finished">
                      <Time
                        timestamp={execution.end_timestamp}
                        format="ddd, DD MMM YYYY HH:mm:ss"
                        data-test="end_timestamp"
                      />
                    </DetailsPanelBodyLine>
                    <DetailsPanelBodyLine label="Execution Time">
                      <span data-test="execution_time">
                        {getExecutionTime(execution)}s
                      </span>
                    </DetailsPanelBodyLine>
                  </DetailsPanelBody>
                </div>
                <DetailsPanelHeading title="Action Output" />
                <DetailsPanelBody>
                  <ActionReporter runner={execution.runner.name} execution={execution} data-test="action_output" />
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
                        { execution.trigger.type }
                      </DetailsPanelBodyLine>
                    ) : null }
                    { execution.trigger_instance && execution.trigger_instance.occurrence_time ? (
                      <DetailsPanelBodyLine label="Occurrence">
                        <Time timestamp={execution.trigger_instance.occurrence_time} format="ddd, DD MMM YYYY HH:mm:ss" />
                      </DetailsPanelBodyLine>
                    ) : null }
                  </DetailsPanelBody>
                  { execution.trigger_instance && execution.trigger_instance.occurrence_time ? (
                    <DetailsPanelBody>
                      <St2Highlight code={execution.trigger_instance.payload} />
                    </DetailsPanelBody>
                  ) : null }
                </DetailsPanel>
              ) : null }
              <DetailsPanel>
                <DetailsPanelHeading title="Action Input" />
                <DetailsPanelBody>
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
                      data-test="action_input"
                    />
                  </form>
                </DetailsPanelBody>
              </DetailsPanel>
            </div>
          ) : null }
          { section === 'code' ? (
            <DetailsPanel data-test="execution_code">
              <St2Highlight code={execution} />
            </DetailsPanel>
          ) : null }
        </DetailsBody>
        <DetailsToolbar>
          <Button small value="Rerun" data-test="rerun_button" onClick={() => this.handleSection('rerun')} />
          <Button small value="Cancel" onClick={() => this.handleCancel()} disabled={!execution || execution.status !== 'running'} />

          <DetailsToolbarSeparator />
        </DetailsToolbar>

        { section === 'rerun' && this.props.handleRerun ? (
          <HistoryPopup
            action={execution.action.ref}
            payload={execution.parameters}
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
