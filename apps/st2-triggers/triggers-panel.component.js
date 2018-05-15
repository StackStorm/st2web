import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import store from './store';

import api from '@stackstorm/module-api';
import {
  actions as flexActions,
} from '@stackstorm/module-flex-table/flex-table.reducer';
import notification from '@stackstorm/module-notification';
import setTitle from '@stackstorm/module-title';

import FlexTable from '@stackstorm/module-flex-table/flex-table.component';
import PackIcon from '@stackstorm/module-pack-icon';
import {
  Panel,
  PanelView,
  Toolbar,
  ToolbarSearch,
  Content,
  ContentEmpty,
  ToggleButton,
} from '@stackstorm/module-panel';
import TriggersFlexCard from './triggers-flex-card.component';
import TriggersDetails from './triggers-details.component';

import './style.less';

@connect((state, props) => {
  const { uid } = props;
  const { collapsed = state.collapsed } = state.tables[uid] || {};

  return { collapsed, ...props };
}, (dispatch, props) => {
  const { uid } = props;

  return {
    onToggle: () => store.dispatch(flexActions.toggle(uid)),
  };
})
class FlexTableWrapper extends FlexTable {
  componentDidMount() {
    const { uid } = this.props;

    store.dispatch(flexActions.register(uid, false));
  }
}

@connect((state) => {
  const { groups, triggers, filter, collapsed } = state;
  return { groups, triggers, filter, collapsed };
})
export default class TriggersPanel extends React.Component {
  static propTypes = {
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
    triggers: PropTypes.array,
    filter: PropTypes.string,
    collapsed: PropTypes.bool,

    triggerSpec: PropTypes.object,
    criteriaSpecs: PropTypes.object,
    actionSpec: PropTypes.object,
    packSpec: PropTypes.object,
  }

  state = {
    id: undefined,
  }

  componentDidMount() {
    let { ref: id } = this.props.match.params;
    if (!id) {
      const { groups } = this.props;
      id = groups && groups.length > 0 && groups[0].triggers.length > 0 ? groups[0].triggers[0].ref : undefined;
    }
    if (id !== this.state.id) {
      this.setState({ id });
    }

    this.fetchGroups();
  }

  componentWillReceiveProps(nextProps) {
    let { ref: id } = nextProps.match.params;
    if (!id) {
      const { groups } = nextProps;
      id = groups && groups.length > 0 && groups[0].triggers.length > 0 ? groups[0].triggers[0].ref : undefined;
    }
    if (id !== this.state.id) {
      this.setState({ id });
    }
  }

  fetchGroups() {
    return Promise.all([
      store.dispatch({
        type: 'FETCH_GROUPS',
        promise: api.client.triggerTypes.list()
          .catch((err) => {
            notification.error('Unable to retrieve trigger types.', { err });
            throw err;
          }),
      }),
      store.dispatch({
        type: 'FETCH_SENSORS',
        promise: api.client.index.request({ method: 'get', path: '/sensortypes' })
          .then(res => res.data)
          .catch((err) => {
            notification.error('Unable to retrieve sensor types.', { err });
            throw err;
          }),
      }),
    ]);
  }

  get urlParams() {
    const { id } = this.state;
    const { section } = this.props.match.params;

    return {
      id,
      section: section || 'general',
    };
  }

  navigate({ id, section } = {}) {
    const current = this.urlParams;

    if (typeof id === 'undefined') {
      if (this.props.match.params.ref) {
        id = current.id;
      }
    }
    if (!id) {
      id = undefined;
    }

    if (typeof section === 'undefined') {
      section = current.section;
    }
    if (section === 'general') {
      section = undefined;
    }

    const pathname = `/triggers${id ? `/${id}${section ? `/${section}` : ''}` : ''}`;

    const { location } = this.props;
    if (location.pathname === pathname) {
      return;
    }

    const { history } = this.props;
    history.push(pathname);
  }

  handleSelect(id) {
    return this.navigate({ id });
  }

  handleToggleAll() {
    return store.dispatch(flexActions.toggleAll());
  }

  handleFilterChange(filter) {
    store.dispatch({
      type: 'SET_FILTER',
      filter,
    });
  }

  render() {
    const { groups, triggers, filter, triggerSpec, criteriaSpecs, actionSpec, packSpec, collapsed } = this.props;
    const { id, section } = this.urlParams;

    if (!triggers.length) {
      return false;
    }

    setTitle([ 'Trigger Types' ]);

    return (
      <Panel data-test="triggers_panel" detailed>
        <PanelView className="st2-triggers">
          <Toolbar title="Trigger Types">
            <ToggleButton collapsed={collapsed} onClick={() => this.handleToggleAll()} />
            <ToolbarSearch
              title="Filter"
              value={filter}
              onChange={({ target: { value }}) => this.handleFilterChange(value)}
            />
          </Toolbar>
          <Content>
            { groups && groups.map(({ pack, triggers }) => {
              const icon = <PackIcon naked name={pack} />;

              return (
                <FlexTableWrapper key={pack} uid={pack} title={pack} icon={icon}>
                  { triggers.map((trigger) => (
                    <TriggersFlexCard
                      key={trigger.ref}
                      trigger={trigger}
                      selected={id === trigger.ref}
                      onClick={() => this.handleSelect(trigger.ref)}
                    />
                  )) }
                </FlexTableWrapper>
              );
            }) }

            { !groups || groups.length > 0 ? null : (
              <ContentEmpty />
            ) }
          </Content>
        </PanelView>

        <TriggersDetails
          ref={(ref) => this._details = ref}
          handleNavigate={(...args) => this.navigate(...args)}

          id={id}
          section={section}

          triggerSpec={triggerSpec}
          criteriaSpecs={criteriaSpecs}
          actionSpec={actionSpec}
          packSpec={packSpec}
        />
      </Panel>
    );
  }
}
