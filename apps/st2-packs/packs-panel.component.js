import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import store from './store';

import api from '@stackstorm/module-api';
import apiPacks from './api';
import {
  actions as flexActions,
} from '@stackstorm/module-flex-table/flex-table.reducer';
import setTitle from '@stackstorm/module-title';

import FlexTable from '@stackstorm/module-flex-table/flex-table.component';
import {
  Panel,
  PanelView,
  Toolbar,
  ToolbarSearch,
  Content,
  ContentEmpty,
  ToggleButton,
} from '@stackstorm/module-panel';
import PacksDetails from './packs-details.component';
import PacksFlexCard from './packs-flex-card.component';

import './style.less';

function waitExecution(execution_id, record) {
  if (record.id === execution_id) {
    if (record.status === 'succeeded') {
      return true;
    }

    if (record.status === 'failed') {
      return false;
    }
  }

  return undefined;
}

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

    store.dispatch(flexActions.register(uid));
  }
}

@connect((state) => {
  const { groups, filter, collapsed } = state;
  return { groups, filter, collapsed };
})
export default class PacksPanel extends React.Component {
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
    api.client.stream.listen().then((source) => {
      this._source = source;

      this._streamListener = (e) => {
        const record = JSON.parse(e.data);

        if (record.ref === this.urlParams.id) {
          this._refreshDetails && this._refreshDetails();
        }

        store.dispatch({
          type: 'UPDATE_PACK',
          event: e.type,
          record,
        });
      };

      this._source.addEventListener('st2.pack__create', this._streamListener);
      this._source.addEventListener('st2.pack__update', this._streamListener);
      this._source.addEventListener('st2.pack__delete', this._streamListener);
    });

    let { ref: id } = this.props.match.params;
    if (!id) {
      const { groups } = this.props;
      id = groups.length > 0 && groups[0].packs.length > 0 ? groups[0].packs[0].ref : undefined;
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
      id = groups.length > 0 && groups[0].packs.length > 0 ? groups[0].packs[0].ref : undefined;
    }
    if (id !== this.state.id) {
      this.setState({ id });
    }
  }

  componentWillUnmount() {
    this._source.removeEventListener('st2.pack__create', this._streamListener);
    this._source.removeEventListener('st2.pack__update', this._streamListener);
    this._source.removeEventListener('st2.pack__delete', this._streamListener);
  }

  fetchGroups() {
    store.dispatch({
      type: 'FETCH_GROUPS',
      promise: apiPacks.list(),
    })
      .then(() => {
        const { id } = this.urlParams;
        const { groups } = this.props;

        if (id && !groups.some(({ packs }) => packs.some(({ ref }) => ref === id))) {
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

    const pathname = `/packs${id ? `/${id}${section ? `/${section}` : ''}` : ''}`;

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

  handleInstall(ref) {
    const { notification, history } = this.props;

    return store.dispatch({
      type: 'INSTALL_PACK',
      ref,
      promise: apiPacks.install(ref)
        .then((res) => {
          notification.success(`Pack "${ref}" has been scheduled for installation.`, {
            buttons: [{
              text: 'Show execution',
              onClick: () => history.push(`/history/${res.execution_id}`),
            }],
          });

          this._refreshDetails && this._refreshDetails();

          return api.client.stream
            .wait('st2.execution__update', (record) => waitExecution(res.execution_id, record))
          ;
        })
        .then((res) => {
          notification.success(`Pack "${ref}" has been successfully installed.`);
          this._refreshDetails && this._refreshDetails();
          return res;
        })
        .catch((res) => {
          notification.error(`Unable to schedule pack "${ref}" for installation. See details in developer tools console.`);
          console.error(res); // eslint-disable-line no-console
          throw res;
        }),
    });
  }

  handleRemove(ref) {
    const { notification, history } = this.props;

    return store.dispatch({
      type: 'UNINSTALL_PACK',
      ref,
      promise: apiPacks.uninstall(ref)
        .then((res) => {
          notification.success(`Pack "${ref}" has been scheduled for removal.`, {
            buttons: [{
              text: 'Show execution',
              onClick: () => history.push(`/history/${res.execution_id}`),
            }],
          });

          this._refreshDetails && this._refreshDetails();

          return api.client.stream
            .wait('st2.execution__update', (record) => waitExecution(res.execution_id, record))
          ;
        })
        .then((res) => {
          notification.success(`Pack "${ref}" has been successfully removed.`);
          this._refreshDetails && this._refreshDetails();
          return res;
        })
        .catch((res) => {
          notification.error(`Unable to schedule pack "${ref}" for removal. See details in developer tools console.`);
          console.error(res); // eslint-disable-line no-console
          throw res;
        }),
    });
  }

  handleConfigSave(ref, pack) {
    const { notification } = this.props;

    return store.dispatch({
      type: 'CONFIGURE_PACK',
      promise: apiPacks.save(ref, pack)
        .then(() => {
          notification.success(`Configuration for pack "${ref}" has been saved succesfully.`);
        })
        .catch((res) => {
          notification.error(`Unable to save the configuration for pack "${ref}". See details in developer tools console.`);
          console.error(res); // eslint-disable-line no-console
          throw res;
        }),
    });
  }

  render() {
    const { notification, groups, filter, collapsed } = this.props;
    const { id, section } = this.urlParams;

    setTitle([ 'Packs' ]);

    return (
      <Panel data-test="packs_panel">
        <PanelView className="st2-packs">
          <Toolbar title="Packs">
            <ToggleButton collapsed={collapsed} onClick={() => this.handleToggleAll()} />
            <ToolbarSearch title="Filter" value={filter} onChange={(e) => this.handleFilterChange(e)} />
          </Toolbar>
          <Content>
            { groups.map(({ status, packs }) => {
              return (
                <FlexTableWrapper key={status} uid={status} title={status} >
                  { packs.map((pack) => (
                    <PacksFlexCard
                      key={pack.ref}
                      pack={pack}
                      selected={id === pack.ref}
                      onClick={() => this.handleSelect(pack.ref)}
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

        { groups.length > 0 ? (
          <PacksDetails
            notification={notification}
            ref={(ref) => this._details = ref}
            handleInstall={(...args) => this.handleInstall(...args)}
            handleRemove={(...args) => this.handleRemove(...args)}
            handleSave={(...args) => this.handleSave(...args)}
            handleFilterChange={(...args) => this.handleFilterChange(...args)}
            provideRefresh={(fn) => this._refreshDetails = fn}

            id={id}
            section={section}
          />
        ) : null }
      </Panel>
    );
  }
}
