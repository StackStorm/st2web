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
import HistoryFlexCard from './history-flex-card.component';
import ActionReporter from '@stackstorm/module-action-reporter';

import './style.less';


@connect((state, props) => {
  const { uid, ...restProps } = props;
  const { collapsed = state.collapsed } = state.tables[uid] || {};

  return { collapsed, ...restProps };
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
  const { executions, selected, collapsed } = state;
  return { executions, selected, collapsed };
})
export default class HistoryPanel extends React.Component {
  static propTypes = {
    collapsed: PropTypes.bool,
    executions: PropTypes.object,
    selected: PropTypes.string,
    history: PropTypes.object,
    match: PropTypes.object
  }

  handleToggleAll() {
    return store.dispatch(flexActions.toggleAll());
  }

  handleSelect(id) {
    const { history } = this.props;
    history.push(`/history/${ id }`);
  }

  handleSection(section) {
    const { history, executions={}, selected } = this.props;
    const { id } = executions[selected] || {};
    history.push(`/history/${ id }/${ section }`);
  }

  componentDidMount() {
    store.dispatch({
      type: 'FETCH_EXECUTIONS',
      promise: api.client.executions.list({
        parent: 'null'
      })
    })
      .then(() => {
        const { selected } = store.getState();

        store.dispatch({
          type: 'SELECT_EXECUTION',
          ref: selected
        });
      })
    ;

    const { ref } = this.props.match.params;
    store.dispatch({ type: 'SELECT_EXECUTION', ref });
  }

  componentWillReceiveProps(nextProps) {
    const { ref } = nextProps.match.params;

    if (ref !== this.props.match.params.ref) {
      store.dispatch({ type: 'SELECT_EXECUTION', ref });
    }
  }

  render() {
    const {
      executions={},
      selected,
      collapsed
    } = this.props;

    const {
      status,
      start_timestamp,
      end_timestamp,
      action = {},
      runner = {},
      rule,
      trigger,
      trigger_instance,
      parameters,
      context: {
        trace_context: {
          trace_tag
        } = {}
      } = {}
    } = executions[selected] || {};

    const execution_time = Math.ceil((new Date(end_timestamp).getTime() - new Date(start_timestamp).getTime()) / 1000);

    const executionGroups = _(executions)
      .sortBy('start_timestamp')
      .reverse()
      .groupBy(record => {
        const date = new Date(record.start_timestamp).toDateString();
        const time = new Date(date).toISOString();
        return time;
      })
      .value()
    ;

    return <Panel>
      <PanelView className="st2-history">
        <Toolbar title="History">
          <ToggleButton collapsed={collapsed} onClick={() => this.handleToggleAll() }/>
        </Toolbar>
        <Content>
          {
            Object.keys(executionGroups).map(key => {
              const date = <Time timestamp={key} format="ddd, DD MMM YYYY" />;
              return !!executionGroups[key] && <FlexTableWrapper uid={key} title={date} titleType="date" key={key}>
                {
                  executionGroups[key]
                    .map(execution => {
                      return [
                        <HistoryFlexCard
                          key={execution.id}
                          execution={execution}
                          selected={selected === execution.id}
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
        <DetailsHeader title={action.ref} subtitle={action.description}/>
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
              return <div>
                <DetailsPanel>
                  <div className="st2-action-reporter__header">
                    <DetailsPanelBody>
                      <DetailsPanelBodyLine label="Status">
                        <Label status={status} />
                      </DetailsPanelBodyLine>
                      <DetailsPanelBodyLine label="Execution ID">
                        <div className="st2-action-reporter__uuid">
                          { selected }
                        </div>
                      </DetailsPanelBodyLine>
                      { trace_tag ?
                        <DetailsPanelBodyLine label="Trace Tag">
                          <div className="st2-action-reporter__uuid">
                            { trace_tag }
                          </div>
                        </DetailsPanelBodyLine>
                        : null
                      }
                      <DetailsPanelBodyLine label="Started">
                        <Time timestamp={start_timestamp} format="ddd, DD MMM YYYY HH:mm:ss" />
                      </DetailsPanelBodyLine>
                      <DetailsPanelBodyLine label="Finished">
                        <Time timestamp={end_timestamp} format="ddd, DD MMM YYYY HH:mm:ss" />
                      </DetailsPanelBodyLine>
                      <DetailsPanelBodyLine label="Execution Time">
                        {execution_time}s
                      </DetailsPanelBodyLine>
                    </DetailsPanelBody>
                  </div>
                  <DetailsPanelHeading title="Action Output" />
                  <DetailsPanelBody>
                    <ActionReporter runner={ runner.name } execution={ executions[selected] } />
                  </DetailsPanelBody>
                </DetailsPanel>
                { rule ?
                  <DetailsPanel>
                    <DetailsPanelHeading title="Rule Details" />
                    <DetailsPanelBody>
                      <DetailsPanelBodyLine label="Rule">
                        <Link to={`/rules/${rule.ref}/general`}>{ rule.ref }</Link>
                      </DetailsPanelBodyLine>
                      { rule.description ?
                        <DetailsPanelBodyLine label="Description">
                          { rule.description }
                        </DetailsPanelBodyLine>
                        : null }
                    </DetailsPanelBody>
                  </DetailsPanel>
                  : null }
                { trigger ?
                  <DetailsPanel>
                    <DetailsPanelHeading title="Trigger Details" />
                    <DetailsPanelBody>
                      { trigger.type ?
                        <DetailsPanelBodyLine label="Trigger">
                          { trigger.type }
                        </DetailsPanelBodyLine>
                        : null }
                      { trigger_instance && trigger_instance.occurrence_time ?
                        <DetailsPanelBodyLine label="Occurrence">
                          <Time timestamp={trigger_instance.occurrence_time} format="ddd, DD MMM YYYY HH:mm:ss" />
                        </DetailsPanelBodyLine>
                        : null }
                    </DetailsPanelBody>
                    { trigger_instance && trigger_instance.occurrence_time ?
                      <DetailsPanelBody>
                        <St2Highlight code={trigger_instance.payload} />
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
                            ...runner.runner_parameters,
                            ...action.parameters,
                          }
                        }}
                        disabled={true}
                        ngModel={parameters} />
                    </form>
                  </DetailsPanelBody>
                </DetailsPanel>
              </div>;
            }} />
            <Route path="/history/:ref/code" render={() => {
              return <DetailsPanel data-test="action_parameters" >
                {
                  !!executions[selected] && <St2Highlight code={executions[selected]} />
                }
              </DetailsPanel>;
            }} />
          </Switch>
        </DetailsBody>
        <DetailsToolbar>
          <Button small value="Rerun" onClick={() => this.handleRerun()} />
          <Button small value="Cancel" onClick={() => this.handleCancel()} disabled={status !== 'running'} />

          <DetailsToolbarSeparator />
        </DetailsToolbar>
      </PanelDetails>
    </Panel>;
  }
}
