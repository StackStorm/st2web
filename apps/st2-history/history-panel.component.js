import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

import store from './store';
import api from '@stackstorm/module-api';

import { actions } from '@stackstorm/module-flex-table/flex-table.reducer.js';
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
} from '@stackstorm/module-panel';
import FlexTable from '@stackstorm/module-flex-table/flex-table.component';
import Time from '@stackstorm/module-time';
import HistoryFlexCard from './history-flex-card.component';

import './style.less';


@connect((state, props) => {
  const { uid, ...restProps } = props;
  const { collapsed = state.collapsed } = state.tables[uid] || {};

  return { collapsed, ...restProps };
}, (dispatch, props) => {
  const { uid } = props;

  return {
    onToggle: () => store.dispatch(actions.toggle(uid))
  };
})
class FlexTableWrapper extends FlexTable {
  componentDidMount() {
    const { uid } = this.props;

    store.dispatch(actions.register(uid));
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
      .sortBy('start_timestamp')
      .groupBy(record => {
        const date = new Date(record.start_timestamp).toDateString();
        const time = new Date(date).toISOString();
        return time;
      })
      .value()
      ;

    return <Panel className="st2-history">
      <PanelView>
        <Toolbar title="History">
          <ToggleButton collapsed={collapsed} onClick={() => this.handleToggleAll() }/>
        </Toolbar>
        <Content>
          {
            Object.keys(executionGroups).map(key => {
              const date = <Time timestamp={key} format="ddd, DD MMM YYYY" />;
              return !!executionGroups[key] && <FlexTableWrapper uid={key} title={date} key={key}>
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
