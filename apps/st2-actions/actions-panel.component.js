import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

import {
  Route,
  Switch,
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
  DetailsBody,
  DetailsPanel,
  DetailsButtonsPanel,
  DetailsToolbar,
  DetailsToolbarSeparator,
  ToggleButton
} from '@stackstorm/module-panel';
import Button from '../../modules/st2-forms/button.component';
import FlexTable from '@stackstorm/module-flex-table/flex-table.component';
import ActionFlexCard from './action-flex-card.component';
import AutoForm from '../../modules/st2-auto-form/auto-form.component';
import St2Highlight from '../../modules/st2-highlight/highlight.component';
import StringField from '../../modules/st2-auto-form/fields/string';


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
  const { actions, selected, collapsed, filter } = state;
  return { actions, selected, collapsed, filter };
})
export default class ActionsPanel extends React.Component {
  static propTypes = {
    notification: PropTypes.object,
    collapsed: PropTypes.bool,
    actions: PropTypes.object,
    selected: PropTypes.string,
    filter: PropTypes.string,
    history: PropTypes.object,
    match: PropTypes.object
  }

  state = {
    runPreview: false
  }

  handleToggleAll() {
    return store.dispatch(flexActions.toggleAll());
  }

  handleSelect(ref) {
    const { history } = this.props;
    history.push(`/actions/${ ref }`);
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

  componentDidMount() {
    store.dispatch({
      type: 'FETCH_ACTIONS',
      promise: api.client.actions.list()
    })
      .then(() => {
        const { selected } = store.getState();

        if (!selected) {
          store.dispatch({ type: 'SELECT_ACTION' });
        }
      })
      ;

    const { ref } = this.props.match.params;
    store.dispatch({ type: 'SELECT_ACTION', ref });
  }

  componentWillReceiveProps(nextProps) {
    const { ref } = nextProps.match.params;

    if (ref !== this.props.match.params.ref) {
      store.dispatch({ type: 'SELECT_ACTION', ref });
    }
  }

  render() {
    const { actions={}, selected, collapsed, filter = '' } = this.props;

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
      <PanelView>
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
        <DetailsBody>
          <Switch>
            <Route exact path="/actions/:ref?/(general)?" render={() => {
              return <DetailsPanel data-test="action_parameters" >
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
              </DetailsPanel>;
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
