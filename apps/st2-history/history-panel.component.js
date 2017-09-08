import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

import store from './store';
import api from '../../modules/st2-api/api';

import { actions } from '../../modules/st2-flex-table/flex-table.reducer.js';
import {
  Panel,
  PanelView,
  PanelDetails,
  Toolbar,
  Content,
  DetailsHeader,
  DetailsBody,
  DetailsToolbar,
  DetailsToolbarSeparator,
  ToggleButton
} from '../../modules/st2-panel/panel.component';
import FlexTable from '../../modules/st2-flex-table/flex-table.component';
import HistoryFlexCard from './history-flex-card.component';


@connect((state, props) => {
  const { collapsed = state.collapsed } = state.tables[props.title] || {};

  return { collapsed, ...props };
}, (dispatch, props) => {
  const { title } = props;

  return {
    onToggle: () => store.dispatch(actions.toggle(title))
  };
})
class FlexTableWrapper extends FlexTable {
  componentDidMount() {
    const { title } = this.props;

    store.dispatch(actions.register(title));
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
    return store.dispatch(actions.toggleAll());
  }

  handleSelect(ref) {
    const { history } = this.props;
    history.push(`/history/${ ref }`);
  }

  componentDidMount() {
    store.dispatch({
      type: 'FETCH_EXECUTIONS',
      promise: api.client.executions.list()
    })
      .then(() => {
        const { selected } = store.getState();

        if (!selected) {
          store.dispatch({ type: 'SELECT_EXECUTION' });
        }
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
    const { executions={}, selected, collapsed } = this.props;

    const {
      action = {}
    } = executions[selected] || {};

    // const filteredRules = _.filter(rules, rule => {
    //   return rule.ref.toLowerCase().indexOf(filter.toLowerCase()) > -1;
    // });

    const executionGroups = _(executions)
      .sortBy('ref')
      .groupBy('pack')
      .value()
      ;

    return <Panel>
      <PanelView>
        <Toolbar title="History">
          <ToggleButton collapsed={collapsed} onClick={() => this.handleToggleAll() }/>
        </Toolbar>
        <Content>
          {
            Object.keys(executionGroups).map(key => {
              return !!executionGroups[key] && <FlexTableWrapper title={key} key={key}>
                {
                  executionGroups[key]
                    .map(execution => {
                      return <HistoryFlexCard key={execution.id} execution={execution}
                        selected={selected === execution.id}
                        onClick={() => this.handleSelect(execution.id)} />;
                    })
                }
              </FlexTableWrapper>;
            })
          }
        </Content>
      </PanelView>
      <PanelDetails data-test="details">
        <DetailsHeader title={action.ref} subtitle={action.description}/>
        <DetailsBody>
          123
        </DetailsBody>
        <DetailsToolbar>
          <DetailsToolbarSeparator />
        </DetailsToolbar>
      </PanelDetails>
    </Panel>;
  }
}
