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
  ToggleButton
} from '@stackstorm/module-panel';
import Button from '@stackstorm/module-forms/button.component';
import {
  FlexTable,
  FlexTableRow,
  FlexTableInsert
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
  const { collapsed = state.collapsed } = state.tables[props.title] || {};

  return { collapsed, ...props };
}, (dispatch, props) => {
  const { title } = props;

  return {
    onToggle: () => store.dispatch(flexActions.toggle(title))
  };
})
class FlexTableWrapper extends FlexTable {
  componentDidMount() {
    const { title } = this.props;

    store.dispatch(flexActions.register(title, true));
  }
}

@connect((state) => {
  const { actions, selected, executions, collapsed, filter } = state;
  return { actions, selected, executions, collapsed, filter };
})
export default class ActionsPanel extends React.Component {
  static propTypes = {
    notification: PropTypes.object,
    collapsed: PropTypes.bool,
    actions: PropTypes.object,
    executions: PropTypes.array,
    selected: PropTypes.string,
    filter: PropTypes.string,
    history: PropTypes.object,
    match: PropTypes.object
  }

  state = {
    runPreview: false,
    executionsVisible: {}
  }

  handleToggleAll() {
    return store.dispatch(flexActions.toggleAll());
  }

  handleSelect(ref) {
    const { history } = this.props;
    history.push(`/actions/${ ref }`);
  }

  handleSection(section) {
    const { history, actions={}, selected } = this.props;
    const { ref } = actions[selected] || {};
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
            trace_tag: this.traceField.getValue()
          }
        }
      })
        .then(res => {
          notification.success(
            `Action "${ref}" has been scheduled successfully`
          );

          return res.values;
        })
        .catch(res => {
          notification.error(
            `Unable to schedule action "${ref}". ` +
            'See details in developer tools console.'
          );
          console.error(res);
        })
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
      filter: e.target.value
    });
  }

  handleToggleExecution(id) {
    this.setState({
      executionsVisible: {
        ...this.state.executionsVisible,
        [id]: !this.state.executionsVisible[id]
      },
    });
  }

  componentDidMount() {
    store.dispatch({
      type: 'FETCH_ACTIONS',
      promise: api.client.actions.list()
    })
      .then(() => {
        const { selected } = store.getState();

        store.dispatch({
          type: 'SELECT_ACTION',
          ref: selected,
          promise: api.client.executions.list({
            action: selected,
          })
        });
      })
    ;

    const { ref } = this.props.match.params;
    store.dispatch({ type: 'SELECT_ACTION', ref });
  }

  componentWillReceiveProps(nextProps) {
    const { ref } = nextProps.match.params;

    if (ref !== this.props.match.params.ref) {
      store.dispatch({
        type: 'SELECT_ACTION',
        ref,
        promise: api.client.executions.list({
          action: ref,
        })
      });
    }
  }

  render() {
    const {
      actions={},
      executions=[],
      selected,
      collapsed,
      filter = ''
    } = this.props;

    const {
      ref,
      description,
      parameters
    } = actions[selected] || {};

    const filteredActions = _.filter(actions, action => {
      return action.ref.toLowerCase().indexOf(filter.toLowerCase()) > -1;
    });

    const actionGroups = _(filteredActions)
      .sortBy('ref')
      .groupBy('pack')
      .value()
    ;

    return <Panel>
      <PanelView className="st2-actions">
        <Toolbar title="Actions">
          <ToggleButton collapsed={collapsed} onClick={() => this.handleToggleAll() }/>
          <ToolbarSearch title="Filter" value={filter} onChange={e => this.handleFilterChange(e)} />
        </Toolbar>
        <Content>
          {
            Object.keys(actionGroups).map(key => {
              const icon = api.client.packFile.route(key+'/icon.png');

              return !!actionGroups[key] && <FlexTableWrapper title={key} key={key} icon={icon}>
                {
                  actionGroups[key]
                    .map(action => {
                      return <ActionFlexCard key={action.ref} action={action}
                        selected={selected === action.ref}
                        onClick={() => this.handleSelect(action.ref)} />;
                    })
                }
              </FlexTableWrapper>;
            })
          }
        </Content>
      </PanelView>
      <PanelDetails data-test="details">
        <DetailsHeader title={ref} subtitle={description}/>
        <Route path="/actions/:ref?/:section?" children={({ match: { params: { section } } }) => {
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
            <Route exact path="/actions/:ref?/(general)?" render={() => {
              return <div>
                <DetailsPanel data-test="action_parameters">
                  <DetailsPanelHeading title="Parameters" />
                  <DetailsPanelBody>
                    <form onSubmit={(e) => this.handleActionRun(e, ref)}>
                      <AutoForm
                        ref={(component) => { this.runField = component; }}
                        spec={{
                          type: 'object',
                          properties: parameters
                        }}
                        ngModel={{}} />
                      <StringField
                        ref={(component) => { this.traceField = component; }}
                        name="trace"
                        spec={{}}
                        value="" />
                      <DetailsButtonsPanel>
                        <Button flat value="Preview" onClick={() => this.handleToggleRunPreview()} />
                        <Button type="submit" value="Run" />
                      </DetailsButtonsPanel>
                      {
                        this.state.runPreview &&
                          <St2Highlight code={this.runField.getValue()}/>
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
                        : <FlexTable>
                          {
                            executions.map(execution => {
                              return [
                                <FlexTableRow
                                  onClick={ () => this.handleToggleExecution(execution.id) }
                                  columns={[
                                    {
                                      className: 'st2-actions__details-column-utility',
                                      children: <i className={`icon-chevron${ this.state.executionsVisible[execution.id] ? '-down': '_right' }`}></i>
                                    },
                                    {
                                      className: 'st2-actions__details-column-meta',
                                      children: <Label status={execution.status} short={true} />
                                    },
                                    {
                                      className: 'st2-actions__details-column-time',
                                      children: <Time timestamp={execution.start_timestamp} format="ddd, DD MMM YYYY" />
                                    },
                                    {
                                      Component: Link,
                                      to: `/history/${execution.id}/general?action=${ref}`,
                                      className: 'st2-actions__details-column-history',
                                      title: 'Jump to History',
                                      children: <i className="icon-history"></i>
                                    },
                                  ]}
                                />,
                                <FlexTableInsert visible={ this.state.executionsVisible[execution.id] || false }>
                                  <ActionReporter runner={ execution.runner.name } execution={ execution } />
                                </FlexTableInsert>
                              ];
                            })
                          }
                        </FlexTable>
                    }
                    <Link className="st2-forms__button st2-forms__button--flat" to={`/history?action=${ref}`}>
                      <i className="icon-history"></i> See full action history
                    </Link>
                  </DetailsPanelBody>
                </DetailsPanel>
              </div>;
            }} />
            <Route path="/actions/:ref/code" render={() => {
              return <DetailsPanel data-test="action_parameters" >
                {
                  !!actions[selected] && <St2Highlight code={actions[selected]} />
                }
              </DetailsPanel>;
            }} />
          </Switch>
        </DetailsBody>
        <DetailsToolbar>
          <DetailsToolbarSeparator />
        </DetailsToolbar>
      </PanelDetails>
    </Panel>;
  }
}
