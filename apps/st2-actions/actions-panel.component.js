import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import store from './store';

import api from '@stackstorm/module-api';
import {
  actions as flexActions,
} from '@stackstorm/module-flex-table/flex-table.reducer';
import setTitle from '@stackstorm/module-title';

import FlexTable from '@stackstorm/module-flex-table';
import {
  Panel,
  PanelView,
  Toolbar,
  ToolbarSearch,
  ToolbarView,
  Content,
  ContentEmpty,
  ToggleButton,
} from '@stackstorm/module-panel';
import View from '@stackstorm/module-view';
import ActionsDetails from './actions-details.component';
import ActionsFlexCard from './actions-flex-card.component';

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

    store.dispatch(flexActions.register(uid, true));
  }
}

@connect((state) => {
  const { groups, filter, collapsed } = state;
  return { groups, filter, collapsed };
})
export default class ActionsPanel extends React.Component {
  static propTypes = {
    notification: PropTypes.object,
    history: PropTypes.object,
    location: PropTypes.shape({
      pathname: PropTypes.string,
    }).isRequired,
    match: PropTypes.shape({
      params: PropTypes.shape({
        ref: PropTypes.string,
        section: PropTypes.string,
      }),
    }),

    groups: PropTypes.array,
    filter: PropTypes.string,
    collapsed: PropTypes.bool,
  }

  state = {
    id: undefined,
  }

  componentDidMount() {
    let { ref: id } = this.props.match.params;
    if (!id) {
      const { groups } = this.props;
      id = groups.length > 0 && groups[0].actions.length > 0 ? groups[0].actions[0].ref : undefined;
    }
    if (id !== this.state.id) {
      this.setState({ id });
    }

    this.fetchGroups().then(() => {
      const { id } = this.urlParams;
      if (id) {
        store.dispatch(flexActions.toggle(id.split('.')[0], false));
      }
    });
  }

  componentWillReceiveProps(nextProps) {
    let { ref: id } = nextProps.match.params;
    if (!id) {
      const { groups } = nextProps;
      id = groups.length > 0 && groups[0].actions.length > 0 ? groups[0].actions[0].ref : undefined;
    }
    if (id !== this.state.id) {
      this.setState({ id }, () => {
        if (id) {
          store.dispatch(flexActions.toggle(id.split('.')[0], false));
        }
      });
    }
  }

  fetchGroups() {
    const { notification } = this.props;

    return store.dispatch({
      type: 'FETCH_GROUPS',
      promise: api.client.actions.list()
        .catch((res) => {
          notification.error('Unable to retrieve actions. See details in developer tools console.');
          console.error(res); // eslint-disable-line no-console
          throw res;
        }),
    })
      .then(() => {
        const { id } = this.urlParams;
        const { groups } = this.props;

        if (id && !groups.some(({ actions }) => actions.some(({ ref }) => ref === id))) {
          this.navigate({ id: false });
        }
      })
    ;
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

    const pathname = `/actions${id ? `/${id}${section ? `/${section}` : ''}` : ''}`;

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

  handleRun(ref, parameters, trace_tag) {
    const { notification } = this.props;

    return store.dispatch({
      type: 'RUN_ACTION',
      promise: api.client.executions.create({
        action: ref,
        parameters,
        context: {
          trace_context: {
            trace_tag,
          },
        },
      })
        .then((execution) => {
          notification.success(`Action "${ref}" has been scheduled successfully.`);
          return execution;
        })
        .catch((res) => {
          notification.error(`Unable to schedule action "${ref}". See details in developer tools console.`);
          console.error(res); // eslint-disable-line no-console
          throw res;
        }),
    });
  }

  render() {
    const { notification, groups, filter, collapsed } = this.props;
    const { id, section } = this.urlParams;

    const view = this._view ? this._view.value : {};

    setTitle([ 'Actions' ]);

    return (
      <Panel data-test="actions_panel">
        <PanelView className="st2-actions">
          <Toolbar title="Actions">
            <ToolbarSearch
              title="Filter"
              value={filter}
              onChange={({ target: { value }}) => this.handleFilterChange(value)}
            />
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

              return (
                <FlexTableWrapper key={pack} uid={pack} title={pack} icon={icon} data-test={`pack pack:${pack}`}>
                  { actions.map((action) => (
                    <ActionsFlexCard
                      key={action.ref}
                      action={action}
                      selected={id === action.ref}
                      view={view}
                      onClick={() => this.handleSelect(action.ref)}
                    />
                  )) }
                </FlexTableWrapper>
              );
            }) }

            { groups.length > 0 ? null : (
              <ContentEmpty />
            ) }
          </Content>
        </PanelView>

        <ActionsDetails
          notification={notification}
          ref={(ref) => this._details = ref}
          handleNavigate={(...args) => this.navigate(...args)}
          handleRun={(...args) => this.handleRun(...args)}
          provideRefresh={(fn) => this._refreshDetails = fn}

          id={id}
          section={section}
        />
      </Panel>
    );
  }
}
