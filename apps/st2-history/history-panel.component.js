import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

import {
  Route,
  Switch,
  Link
} from 'react-router-dom';

import store from './store';
import api from '@stackstorm/module-api';

import { actions as flexActions } from '@stackstorm/module-flex-table/flex-table.reducer.js';
import {
  Panel,
  PanelView,
  PanelDetails,
  Toolbar,
  Content,
  DetailsHeader,
  DetailsSwitch,
  DetailsBody,
  DetailsPanel,
  DetailsPanelHeading,
  DetailsPanelBody,
  DetailsPanelBodyLine,
  // DetailsButtonsPanel,
  DetailsToolbar,
  DetailsToolbarSeparator,
  ToggleButton
} from '@stackstorm/module-panel';
import Button from '@stackstorm/module-forms/button.component';
import {
  FlexTable
} from '@stackstorm/module-flex-table';
import AutoForm from '@stackstorm/module-auto-form';
import St2Highlight from '@stackstorm/module-highlight';
import Time from '@stackstorm/module-time';
import Label from '@stackstorm/module-label';
import ActionReporter from '@stackstorm/module-action-reporter';

import HistoryFlexCard from './history-flex-card.component';
import HistoryPopup from './history-popup.component';

import './style.less';


@connect((state, props) => {
  const { uid } = props;
  const { collapsed = state.collapsed } = state.tables[uid] || {};

  return { collapsed, ...props };
}, (dispatch, props) => {
  const { uid } = props;

  return {
    onToggle: () => store.dispatch(flexActions.toggle(uid))
  };
})
class FlexTableWrapper extends FlexTable {
  componentDidMount() {
    const { uid } = this.props;

    store.dispatch(flexActions.register(uid));
  }
}

@connect((state) => {
  const { groups, execution, collapsed } = state;
  return { groups, execution, collapsed };
})
export default class HistoryPanel extends React.Component {
  static propTypes = {
    history: PropTypes.object,
    match: PropTypes.shape({
      params: PropTypes.shape({
        ref: PropTypes.string,
      }),
    }),

    groups: PropTypes.array,
    execution: PropTypes.object,
    collapsed: PropTypes.bool,
  }

  handleToggleAll() {
    return store.dispatch(flexActions.toggleAll());
  }

  handleSelect(id) {
    const { history } = this.props;
    history.push(`/history/${ id }`);
  }

  handleSection(section) {
    const { history, execution: { id } } = this.props;
    history.push(`/history/${ id }/${ section }`);
  }

  handleRerun(parameters) {
    const { execution: { id } } = this.props;

    return store.dispatch({
      type: 'DELETE_RULE',
      promise: api.client.executions.repeat(id, { parameters }, {
        no_merge: true
      })
    })
      .then(() => {
        this.handleSection('general');
      });
  }

  componentDidMount() {
    store.dispatch({
      type: 'FETCH_GROUPS',
      promise: api.client.executions.list()
    })
      .then(() => {
        let { ref, execution } = store.getState();

        if (!execution) {
          ref = this.props.match.params.ref || ref;

          store.dispatch({
            type: 'FETCH_EXECUTION',
            promise: api.client.executions.get(ref),
          });
        }
      })
    ;

    const { ref } = this.props.match.params;
    store.dispatch({ type: 'SELECT_EXECUTION', ref });
  }

  componentWillReceiveProps(nextProps) {
    const { ref } = nextProps.match.params;

    if (ref !== this.props.match.params.ref) {
      store.dispatch({
        type: 'FETCH_EXECUTION',
        promise: api.client.executions.get(ref),
      });
    }
  }

  render() {
    const { groups, execution, collapsed } = this.props;

    const execution_time = execution && Math.ceil((new Date(execution.end_timestamp).getTime() - new Date(execution.start_timestamp).getTime()) / 1000);

    return <Panel>
      <PanelView className="st2-history">
        <Toolbar title="History">
          <ToggleButton collapsed={collapsed} onClick={() => this.handleToggleAll() }/>
        </Toolbar>
        <Content>
          {
            groups.map(({ date, executions }) => {
              const title = <Time timestamp={date} format="ddd, DD MMM YYYY" />;
              const id = execution && execution.id;

              return <FlexTableWrapper key={date} uid={date} title={title} titleType="date">
                {
                  executions
                    .map(execution => {
                      return [
                        <HistoryFlexCard
                          key={execution.id}
                          execution={execution}
                          selected={id === execution.id}
                          onClick={() => this.handleSelect(execution.id)}
                        />,
                        null, // TODO: children
                      ];
                    })
                }
              </FlexTableWrapper>;
            })
          }
        </Content>
      </PanelView>
      <PanelDetails data-test="details">
        <DetailsHeader title={execution && execution.action.ref} subtitle={execution && execution.action.description} />
        <Route path="/history/:ref?/:section?" children={({ match: { params: { section } } }) => {
          return <DetailsSwitch
            sections={[
              { label: 'General', path: 'general' },
              { label: 'Code', path: 'code' }
            ]}
            current={ section }
            onChange={ ({ path }) => this.handleSection(path) }/>;
        }} />
        <DetailsBody>
          <Switch>
            <Route exact path="/history/:ref?/(general)?" render={() => {
              if (!execution) {
                return null;
              }

              return <div>
                <DetailsPanel>
                  <div className="st2-action-reporter__header">
                    <DetailsPanelBody>
                      <DetailsPanelBodyLine label="Status">
                        <Label status={execution.status} />
                      </DetailsPanelBodyLine>
                      <DetailsPanelBodyLine label="Execution ID">
                        <div className="st2-action-reporter__uuid">
                          { execution && execution.id }
                        </div>
                      </DetailsPanelBodyLine>
                      { execution.context && execution.context.trace_context && execution.context.trace_context.trace_tag ?
                        <DetailsPanelBodyLine label="Trace Tag">
                          <div className="st2-action-reporter__uuid">
                            { execution.context.trace_context.trace_tag }
                          </div>
                        </DetailsPanelBodyLine>
                        : null
                      }
                      <DetailsPanelBodyLine label="Started">
                        <Time timestamp={execution.start_timestamp} format="ddd, DD MMM YYYY HH:mm:ss" />
                      </DetailsPanelBodyLine>
                      <DetailsPanelBodyLine label="Finished">
                        <Time timestamp={execution.end_timestamp} format="ddd, DD MMM YYYY HH:mm:ss" />
                      </DetailsPanelBodyLine>
                      <DetailsPanelBodyLine label="Execution Time">
                        {execution_time}s
                      </DetailsPanelBodyLine>
                    </DetailsPanelBody>
                  </div>
                  <DetailsPanelHeading title="Action Output" />
                  <DetailsPanelBody>
                    <ActionReporter runner={ execution.runner.name } execution={ execution } />
                  </DetailsPanelBody>
                </DetailsPanel>
                { execution.rule ?
                  <DetailsPanel>
                    <DetailsPanelHeading title="Rule Details" />
                    <DetailsPanelBody>
                      <DetailsPanelBodyLine label="Rule">
                        <Link to={`/rules/${execution.rule.ref}/general`}>{ execution.rule.ref }</Link>
                      </DetailsPanelBodyLine>
                      { execution.rule.description ?
                        <DetailsPanelBodyLine label="Description">
                          { execution.rule.description }
                        </DetailsPanelBodyLine>
                        : null }
                    </DetailsPanelBody>
                  </DetailsPanel>
                  : null }
                { execution.trigger ?
                  <DetailsPanel>
                    <DetailsPanelHeading title="Trigger Details" />
                    <DetailsPanelBody>
                      { execution.trigger.type ?
                        <DetailsPanelBodyLine label="Trigger">
                          { execution.trigger.type }
                        </DetailsPanelBodyLine>
                        : null }
                      { execution.trigger_instance && execution.trigger_instance.occurrence_time ?
                        <DetailsPanelBodyLine label="Occurrence">
                          <Time timestamp={execution.trigger_instance.occurrence_time} format="ddd, DD MMM YYYY HH:mm:ss" />
                        </DetailsPanelBodyLine>
                        : null }
                    </DetailsPanelBody>
                    { execution.trigger_instance && execution.trigger_instance.occurrence_time ?
                      <DetailsPanelBody>
                        <St2Highlight code={execution.trigger_instance.payload} />
                      </DetailsPanelBody>
                      :null }
                  </DetailsPanel>
                  : null }
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
                          }
                        }}
                        disabled={true}
                        ngModel={execution.parameters} />
                    </form>
                  </DetailsPanelBody>
                </DetailsPanel>
              </div>;
            }} />
            <Route path="/history/:ref/code" render={() => {
              return <DetailsPanel data-test="action_parameters">
                {
                  !!execution && <St2Highlight code={execution} />
                }
              </DetailsPanel>;
            }} />
          </Switch>
        </DetailsBody>
        <DetailsToolbar>
          <Button small value="Rerun" onClick={() => this.handleSection('rerun')} />
          <Button small value="Cancel" onClick={() => this.handleCancel()} disabled={status !== 'running'} />

          <DetailsToolbarSeparator />
        </DetailsToolbar>
      </PanelDetails>

      { execution
        ? <Route path="/history/:ref/rerun" render={() => {
          return <HistoryPopup
            action={execution.action.ref}
            payload={execution.parameters}
            spec={{
              type: 'object',
              properties: {
                ...execution.runner.runner_parameters,
                ...execution.action.parameters,
              }
            }}

            onSubmit={(data) => this.handleRerun(data)}
            onCancel={() => this.handleSection('general')}
          />;
        }} />
        : null
      }
    </Panel>;
  }
}
