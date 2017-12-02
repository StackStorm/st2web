import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

import {
  Route,
  Switch,
  Link,
} from 'react-router-dom';

import store from './store';
import api from '@stackstorm/module-api';

import { actions as flexActions } from '@stackstorm/module-flex-table/flex-table.reducer.js';
import {
  Panel,
  PanelView,
  PanelDetails,
  Toolbar,
  ToolbarSearch,
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
import ActionFlexCard from './action-flex-card.component';
import AutoForm from '@stackstorm/module-auto-form';
import St2Highlight from '@stackstorm/module-highlight';
import StringField from '@stackstorm/module-auto-form/fields/string';
import Time from '@stackstorm/module-time';
import Label from '@stackstorm/module-label';
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
    match: PropTypes.shape({
      params: PropTypes.shape({
        ref: PropTypes.string,
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
    executionsVisible: {},
  }

  componentDidMount() {
    store.dispatch({
      type: 'FETCH_GROUPS',
      promise: api.client.actions.list(),
    })
      .then(() => {
        let { ref, action } = store.getState();

        if (!action) {
          ref = this.props.match.params.ref || ref;

          store.dispatch({
            type: 'FETCH_ACTION',
            promise: api.client.actionOverview.get(ref),
          });

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
      store.dispatch({
        type: 'FETCH_ACTION',
        promise: api.client.actionOverview.get(ref),
      }).then(() => {
        store.dispatch({
          type: 'FETCH_EXECUTIONS',
          promise: api.client.executions.list({
            action: ref,
          }),
        });
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    if (nextProps.match.params.ref !== this.props.match.params.ref) {
      return false;
    }

    return true;
  }

  handleToggleAll() {
    return store.dispatch(flexActions.toggleAll());
  }

  handleSelect(ref) {
    const { history } = this.props;
    history.push(`/actions/${ ref }`);
  }

  handleSection(section) {
    const { history, action: { ref } } = this.props;
    history.push(`/actions/${ ref }/${ section }`);
  }

  handleActionRun(e, ref) {
    e.preventDefault();

    const { notification } = this.props;

    return store.dispatch({
      type: 'RUN_ACTION',
      ref,
      promise: api.client.executions.create({
        action: ref,
        parameters: this.runField.getValue(),
        context: {
          trace_context: {
            trace_tag: this.traceField.getValue(),
          },
        },
      })
        .then(res => {
          notification.success(`Action "${ref}" has been scheduled successfully`);

          return res.values;
        })
        .catch(res => {
          notification.error(`Unable to schedule action "${ref}". See details in developer tools console.`);
          console.error(res);
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

    return (
      <Panel>
        <PanelView className="st2-actions">
          <Toolbar title="Actions">
            <ToggleButton collapsed={collapsed} onClick={() => this.handleToggleAll()} />
            <ToolbarSearch title="Filter" value={filter} onChange={e => this.handleFilterChange(e)} />
          </Toolbar>
          <Content>
            {
              groups.map(({ pack, actions }) => {
                const icon = api.client.packFile.route(pack + '/icon.png');
                const ref = action && action.ref;

                return (
                  <FlexTableWrapper title={pack} key={pack} icon={icon}>
                    {
                      actions
                        .map(action => {
                          return (
                            <ActionFlexCard
                              key={action.ref} action={action}
                              selected={ref === action.ref}
                              onClick={() => this.handleSelect(action.ref)}
                            />
                          );
                        })
                    }
                  </FlexTableWrapper>
                );
              })
            }
          </Content>
        </PanelView>
        <PanelDetails data-test="details">
          <DetailsHeader title={action && action.ref} subtitle={action && action.description} />
          <Route path="/actions/:ref?/:section?">
            {
              ({ match: { params: { section } } }) => {
                return (
                  <DetailsSwitch
                    sections={[
                      { label: 'General', path: 'general' },
                      { label: 'Code', path: 'code' },
                    ]}
                    current={section}
                    onChange={({ path }) => this.handleSection(path)}
                  />
                );
              }
            }
          </Route>
          <DetailsBody>
            <Switch>
              <Route
                exact path="/actions/:ref?/(general)?" render={() => {
                  if (!action) {
                    return null;
                  }

                  return (
                    <div>
                      <DetailsPanel data-test="action_parameters">
                        <DetailsPanelHeading title="Parameters" />
                        <DetailsPanelBody>
                          <form onSubmit={(e) => this.handleActionRun(e, action.ref)}>
                            <AutoForm
                              ref={(component) => { this.runField = component; }}
                              spec={{
                                type: 'object',
                                properties: action.parameters,
                              }}
                              ngModel={{}}
                            />
                            <StringField
                              ref={(component) => { this.traceField = component; }}
                              name="trace"
                              spec={{}}
                              value=""
                            />
                            <DetailsButtonsPanel>
                              <Button flat value="Preview" onClick={() => this.handleToggleRunPreview()} />
                              <Button type="submit" value="Run" />
                            </DetailsButtonsPanel>
                            {
                              this.state.runPreview &&
                          <St2Highlight code={this.runField.getValue()} />
                            }
                          </form>
                        </DetailsPanelBody>
                      </DetailsPanel>
                      <DetailsPanel data-test="action_executions">
                        <DetailsPanelHeading title="Executions" />
                        <DetailsPanelBody>
                          {
                            executions.length === 0
                              ? <div className="st2-details__panel-empty ng-scope">No history records for this action</div>
                              : (
                                <FlexTable>
                                  {
                                    executions.map(execution => {
                                      return [
                                        <FlexTableRow
                                          key={execution.id}
                                          onClick={() => this.handleToggleExecution(execution.id)}
                                          columns={[
                                            {
                                              className: 'st2-actions__details-column-utility',
                                              children: <i className={`icon-chevron${ this.state.executionsVisible[execution.id] ? '-down': '_right' }`} />,
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
                                      ];
                                    })
                                  }
                                </FlexTable>
                              )
                          }
                          <Link className="st2-forms__button st2-forms__button--flat" to={`/history?action=${action.ref}`}>
                            <i className="icon-history" /> See full action history
                          </Link>
                        </DetailsPanelBody>
                      </DetailsPanel>
                    </div>
                  );
                }}
              />
              <Route
                path="/actions/:ref/code" render={() => {
                  return (
                    <DetailsPanel data-test="action_parameters" >
                      { action ? <St2Highlight code={action} /> : null }
                    </DetailsPanel>
                  );
                }}
              />
            </Switch>
          </DetailsBody>
          <DetailsToolbar>
            <DetailsToolbarSeparator />
          </DetailsToolbar>
        </PanelDetails>
      </Panel>
    );
  }
}
