import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

import { Link } from 'react-router-dom';

import store from './store';
import api from '@stackstorm/module-api';
import qs from 'querystring';

import { actions as flexActions } from '@stackstorm/module-flex-table/flex-table.reducer.js';
import {
  Panel,
  PanelView,
  PanelDetails,
  Toolbar,
  ToolbarSearch,
  ToolbarView,
  Content,
  DetailsHeader,
  DetailsSwitch,
  DetailsBody,
  DetailsPanel,
  DetailsPanelHeading,
  DetailsPanelBody,
  DetailsButtonsPanel,
  DetailsToolbar,
  DetailsToolbarSeparator,
  ToggleButton,
} from '@stackstorm/module-panel';
import Button from '@stackstorm/module-forms/button.component';
import {
  FlexTable,
  FlexTableRow,
  FlexTableInsert,
} from '@stackstorm/module-flex-table';
import ActionsFlexCard from './actions-flex-card.component';
import AutoForm from '@stackstorm/module-auto-form';
import St2Highlight from '@stackstorm/module-highlight';
import StringField from '@stackstorm/module-auto-form/fields/string';
import Time from '@stackstorm/module-time';
import Label from '@stackstorm/module-label';
import View from '@stackstorm/module-view';
import ActionReporter from '@stackstorm/module-action-reporter';

import './style.less';

@connect((state, props) => {
  const { title } = props;
  const { collapsed = state.collapsed } = state.tables[title] || {};

  return { collapsed, ...props };
}, (dispatch, props) => {
  const { title } = props;

  return {
    onToggle: () => store.dispatch(flexActions.toggle(title)),
  };
})
class FlexTableWrapper extends FlexTable {
  componentDidMount() {
    const { title } = this.props;

    store.dispatch(flexActions.register(title, true));
  }
}

@connect((state) => {
  const { groups, filter, action, executions, collapsed } = state;
  return { groups, filter, action, executions, collapsed };
})
export default class ActionsPanel extends React.Component {
  static propTypes = {
    notification: PropTypes.object,
    history: PropTypes.object,
    location: PropTypes.shape({
      search: PropTypes.string,
    }),
    match: PropTypes.shape({
      params: PropTypes.shape({
        ref: PropTypes.string,
        section: PropTypes.string,
      }),
    }),

    groups: PropTypes.array,
    filter: PropTypes.string,
    action: PropTypes.object,
    executions: PropTypes.array,
    collapsed: PropTypes.bool,
  }

  state = {
    runPreview: false,
    runValue: null,
    runTrace: null,
    executionsVisible: {},
  }

  componentDidMount() {
    store.dispatch({
      type: 'FETCH_GROUPS',
      promise: api.client.actions.list(),
    })
      .then(() => {
        const { action } = store.getState();
        let { ref } = store.getState();

        if (!action) {
          ref = this.props.match.params.ref || ref;

          store.dispatch({
            type: 'FETCH_ACTION',
            promise: api.client.actionOverview.get(ref),
          })
            .then(() => {
              this.setState({ runValue: {}, runTrace: '' });
              store.dispatch(flexActions.toggle(this.props.action.pack, false));
            })
          ;

          store.dispatch({
            type: 'FETCH_EXECUTIONS',
            promise: api.client.executions.list({
              action: ref,
            }),
          });
        }
      })
    ;
  }

  componentWillReceiveProps(nextProps) {
    const { ref } = nextProps.match.params;

    if (ref !== this.props.match.params.ref) {
      store.dispatch(flexActions.toggle(ref.split('.')[0], false));

      store.dispatch({
        type: 'FETCH_ACTION',
        promise: api.client.actionOverview.get(ref),
      })
        .then(() => {
          this.setState({ runValue: {}, runTrace: '' });
          store.dispatch(flexActions.toggle(this.props.action.pack, false));
        })
        .then(() => {
          store.dispatch({
            type: 'FETCH_EXECUTIONS',
            promise: api.client.executions.list({
              action: ref,
            }),
          });
        })
      ;
    }
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    if (nextProps.match.params.ref !== this.props.match.params.ref) {
      return false;
    }

    return true;
  }

  get urlParams() {
    const { ref, section } = this.props.match.params;
    const { ...params } = qs.parse(this.props.location.search.slice(1));

    return {
      ref,
      section: section || 'general',
      params,
    };
  }

  handleToggleAll() {
    return store.dispatch(flexActions.toggleAll());
  }

  handleSelect(ref) {
    const { history } = this.props;
    history.push(`/actions/${ref}`);
  }

  handleSection(section) {
    const { history, action: { ref } } = this.props;
    history.push(`/actions/${ref}/${section}`);
  }

  handleRunAction(e, ref) {
    e.preventDefault();

    const { notification } = this.props;

    return store.dispatch({
      type: 'RUN_ACTION',
      ref,
      promise: api.client.executions.create({
        action: ref,
        parameters: this.state.runValue,
        context: {
          trace_context: {
            trace_tag: this.state.runTrace || undefined,
          },
        },
      })
        .then((res) => {
          notification.success(`Action "${ref}" has been scheduled successfully`);

          return res.values;
        })
        .catch((res) => {
          notification.error(`Unable to schedule action "${ref}". See details in developer tools console.`);
          console.error(res); // eslint-disable-line no-console
        }),
    });
  }

  handleToggleRunPreview() {
    let { runPreview } = this.state;

    runPreview = !runPreview;

    this.setState({ runPreview });
  }

  handleFilterChange(e) {
    store.dispatch({
      type: 'SET_FILTER',
      filter: e.target.value,
    });
  }

  handleToggleExecution(id) {
    this.setState({
      executionsVisible: {
        ...this.state.executionsVisible,
        [id]: !this.state.executionsVisible[id],
      },
    });
  }

  render() {
    const { groups, filter, action, executions, collapsed } = this.props;
    const { section } = this.urlParams;
    const view = this._view ? this._view.value : {};

    return (
      <Panel data-test="actions_panel">
        <PanelView className="st2-actions">
          <Toolbar title="Actions">
            <ToolbarSearch title="Filter" value={filter} onChange={(e) => this.handleFilterChange(e)} />
            <ToolbarView>
              <View
                name="st2ActionView"
                spec={{
                  'type': { title: 'Type', default: true },
                  'action': { title: 'Action', default: true },
                  'runner': { title: 'Runner', default: true },
                  'description': { title: 'Description', default: true },
                }}
                ref={(ref) => this._view = ref}
                onChange={() => this.forceUpdate()}
              />
            </ToolbarView>
            <ToggleButton collapsed={collapsed} onClick={() => this.handleToggleAll()} />
          </Toolbar>
          <Content>
            { groups.map(({ pack, actions }) => {
              const icon = api.client.packFile.route(`${pack}/icon.png`);
              const ref = action && action.ref;

              return (
                <FlexTableWrapper title={pack} key={pack} icon={icon} data-test={`pack pack:${pack}`}>
                  { actions.map((action) => (
                    <ActionsFlexCard
                      key={action.ref} action={action}
                      selected={ref === action.ref}
                      view={view}
                      onClick={() => this.handleSelect(action.ref)}
                    />
                  )) }
                </FlexTableWrapper>
              );
            }) }
          </Content>
        </PanelView>
        <PanelDetails data-test="details">
          <DetailsHeader title={action && action.ref} subtitle={action && action.description} />
          <DetailsSwitch
            sections={[
              { label: 'General', path: 'general' },
              { label: 'Code', path: 'code' },
            ]}
            current={section}
            onChange={({ path }) => this.handleSection(path)}
          />
          <DetailsBody>
            { section === 'general' && action ? (
              <div>
                <DetailsPanel data-test="action_parameters">
                  <DetailsPanelHeading title="Parameters" />
                  <DetailsPanelBody>
                    <form onSubmit={(e) => this.handleRunAction(e, action.ref)}>
                      <AutoForm
                        spec={{
                          type: 'object',
                          properties: action.parameters,
                        }}
                        data={this.state.runValue}
                        onChange={(runValue) => this.setState({ runValue })}
                      />
                      <StringField
                        name="trace"
                        spec={{}}
                        value={this.state.runTrace}
                        onChange={({ target: { value } }) => this.setState({ runTrace: value })}
                      />
                      <DetailsButtonsPanel>
                        <Button flat value="Preview" onClick={() => this.handleToggleRunPreview()} />
                        <Button submit value="Run" data-test="run_submit" />
                      </DetailsButtonsPanel>
                      { this.state.runPreview ? (
                        <St2Highlight data-test="action_code" code={this.state.runValue} />
                      ) : null }
                    </form>
                  </DetailsPanelBody>
                </DetailsPanel>
                <DetailsPanel data-test="action_executions">
                  <DetailsPanelHeading title="Executions" />
                  <DetailsPanelBody>
                    { executions.length === 0 ? (
                      <div className="st2-details__panel-empty">No history records for this action</div>
                    ) : (
                      <FlexTable>
                        { executions.map((execution) => [
                          <FlexTableRow
                            key={execution.id}
                            onClick={() => this.handleToggleExecution(execution.id)}
                            columns={[
                              {
                                className: 'st2-actions__details-column-utility',
                                children: <i className={`icon-chevron${this.state.executionsVisible[execution.id] ? '-down': '_right'}`} />,
                              },
                              {
                                className: 'st2-actions__details-column-meta',
                                children: <Label status={execution.status} short={true} />,
                              },
                              {
                                className: 'st2-actions__details-column-time',
                                children: <Time timestamp={execution.start_timestamp} format="ddd, DD MMM YYYY" />,
                              },
                              {
                                Component: Link,
                                to: `/history/${execution.id}/general?action=${action.ref}`,
                                className: 'st2-actions__details-column-history',
                                title: 'Jump to History',
                                children: <i className="icon-history" />,
                              },
                            ]}
                          />,
                          <FlexTableInsert key={`${execution.id}-insert`} visible={this.state.executionsVisible[execution.id] || false}>
                            <ActionReporter runner={execution.runner.name} execution={execution} />
                          </FlexTableInsert>,
                        ]) }
                      </FlexTable>
                    ) }
                    <Link className="st2-forms__button st2-forms__button--flat" to={`/history?action=${action.ref}`}>
                      <i className="icon-history" /> See full action history
                    </Link>
                  </DetailsPanelBody>
                </DetailsPanel>
              </div>
            ) : null }
            { section === 'code' && action ? (
              <DetailsPanel data-test="action_code">
                <St2Highlight code={action} />
              </DetailsPanel>
            ) : null }
          </DetailsBody>
          <DetailsToolbar>
            <DetailsToolbarSeparator />
          </DetailsToolbar>
        </PanelDetails>
      </Panel>
    );
  }
}
