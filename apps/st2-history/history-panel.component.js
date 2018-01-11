import _ from 'lodash';
import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import store from './store';

import cx from 'classnames';
import qs from 'querystring';
import api from '@stackstorm/module-api';
import {
  actions as flexActions,
} from '@stackstorm/module-flex-table/flex-table.reducer';
import notification from '@stackstorm/module-notification';
import setTitle from '@stackstorm/module-title';

import Filter from '@stackstorm/module-filter';
import FlexTable from '@stackstorm/module-flex-table';
import Button from '@stackstorm/module-forms/button.component';
import {
  Panel,
  PanelView,
  PanelNavigation,
  Toolbar,
  ToolbarFilters,
  ToolbarView,
  Content,
  ContentEmpty,
  ToggleButton,
} from '@stackstorm/module-panel';
import Time from '@stackstorm/module-time';
import View from '@stackstorm/module-view';
import HistoryDetails from './history-details.component';
import HistoryFlexCard from './history-flex-card.component';

import './style.less';

const PER_PAGE = 50;

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
  const { filters, groups, collapsed } = state;
  return { filters, groups, collapsed };
})
export default class HistoryPanel extends React.Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
    location: PropTypes.shape({
      pathname: PropTypes.string,
      search: PropTypes.string,
    }).isRequired,
    match: PropTypes.shape({
      params: PropTypes.shape({
        ref: PropTypes.string,
        section: PropTypes.string,
      }).isRequired,
    }).isRequired,

    filters: PropTypes.object,
    groups: PropTypes.array,
    collapsed: PropTypes.bool,
  }

  state = {
    maxPages: 0,
    id: undefined,
    displayUTC: false,
  }

  componentDidMount() {
    api.client.stream.listen().then((source) => {
      this._source = source;

      this._streamListener = (e) => {
        const record = JSON.parse(e.data);

        if (record.id === this.urlParams.id) {
          this._refreshDetails && this._refreshDetails();
        }

        store.dispatch({
          type: 'UPDATE_EXECUTION',
          event: e.type,
          record,
        });
      };

      this._source.addEventListener('st2.execution__create', this._streamListener);
      this._source.addEventListener('st2.execution__update', this._streamListener);
      this._source.addEventListener('st2.execution__delete', this._streamListener);
    });

    let { ref: id } = this.props.match.params;
    if (!id) {
      const { groups } = this.props;
      id = groups && groups.length > 0 && groups[0].executions.length > 0 ? groups[0].executions[0].id : undefined;
    }
    if (id !== this.state.id) {
      this.setState({ id });
    }

    const { page, activeFilters } = this.urlParams;
    this.fetchGroups({ page, activeFilters });

    store.dispatch({
      type: 'FETCH_FILTERS',
      promise: api.client.executionsFilters.list()
        .catch((err) => {
          notification.error('Unable to retrieve history.', { err });
          throw err;
        }),
    });
  }

  componentWillReceiveProps(nextProps) {
    const next = parseSearch(nextProps.location.search);
    const current = parseSearch(this.props.location.search);

    let { ref: id } = nextProps.match.params;
    if (!id) {
      const { groups } = nextProps;
      id = groups && groups.length > 0 && groups[0].executions.length > 0 ? groups[0].executions[0].id : undefined;
    }
    if (id !== this.state.id) {
      this.setState({ id });
    }

    if (next.page !== current.page || !_.isEqual(next.activeFilters, current.activeFilters)) {
      this.fetchGroups(next);
    }
  }

  componentWillUnmount() {
    this._source.removeEventListener('st2.execution__create', this._streamListener);
    this._source.removeEventListener('st2.execution__update', this._streamListener);
    this._source.removeEventListener('st2.execution__delete', this._streamListener);
  }

  fetchGroups({ page, activeFilters }) {
    return store.dispatch({
      type: 'FETCH_GROUPS',
      promise: api.client.executions.list({
        ...activeFilters,
        parent: 'null',
        limit: PER_PAGE,
        page,
      })
        .then((res) => {
          const { total, limit } = api.client.executions;
          this.setState({
            maxPages: Math.ceil(total / limit),
          });

          return res;
        })
        .catch((err) => {
          notification.error('Unable to retrieve history.', { err });
          throw err;
        }),
    })
      .then(() => {
        const { id: ref } = this.urlParams;
        const { groups } = this.props;

        if (ref && groups && !groups.some(({ executions }) => executions.some(({ id }) => id === ref))) {
          this.navigate({ id: false });
        }
      })
    ;
  }

  get urlParams() {
    const { id } = this.state;
    const { section } = this.props.match.params;
    const { page, activeFilters } = parseSearch(this.props.location.search);

    return {
      id,
      section: section || 'general',
      page,
      activeFilters,
    };
  }

  navigate({ id, section, page, activeFilters } = {}) {
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

    if (typeof page === 'undefined') {
      page = current.page;
    }
    if (page === 1) {
      page = undefined;
    }

    if (typeof activeFilters === 'undefined') {
      activeFilters = current.activeFilters;
    }

    const query = stringifySearch(page, activeFilters);

    const pathname = `/history${id ? `/${id}${section ? `/${section}` : ''}` : ''}`;
    const search = `${query ? `?${query}` : ''}`;

    const { location } = this.props;
    if (location.pathname === pathname && location.search === search) {
      return;
    }

    const { history } = this.props;
    history.push(`${pathname}${search}`);
  }

  handleSelect(id) {
    return this.navigate({ id });
  }

  handlePage(page) {
    return this.navigate({ page });
  }

  handleToggleUTC() {
    const { displayUTC } = this.state;

    this.setState({ displayUTC: !displayUTC });
  }

  handleToggleAll() {
    return store.dispatch(flexActions.toggleAll());
  }

  handleExpandChildren(id, expanded) {
    return store.dispatch({
      type: 'FETCH_EXECUTION_CHILDREN',
      id,
      expanded,
      promise: expanded ? api.client.executions.list({
        parent: id,
      })
        .catch((err) => {
          notification.error('Unable to retrieve children.', { err });
          throw err;
        }) : null,
    });
  }

  handleRerun(parameters) {
    const { id } = this.urlParams;

    return store.dispatch({
      type: 'RERUN_EXECUTION',
      promise: api.client.executions.repeat(id, { parameters }, {
        no_merge: true,
      })
        .then((execution) => {
          notification.success(`Execution "${execution.action.ref}" has been rerun successfully.`);

          this.navigate({
            id: execution.id,
            section: 'general',
          });

          return execution;
        })
        .catch((err) => {
          notification.error(`Unable to rerun execution "${id}".`, {
            err,
            execution_id: err.id,
          });
          throw err;
        }),
    });
  }

  handleCancel(parameters) {
    const { id } = this.urlParams;

    return store.dispatch({
      type: 'CANCEL_EXECUTION',
      promise: api.client.executions.delete(id)
        .then((execution) => {
          notification.success(`Execution "${execution.action.ref}" has been canceled successfully.`);

          return execution;
        })
        .catch((err) => {
          notification.error(`Unable to cancel execution "${id}".`, {
            err,
            execution_id: err.id,
          });
          throw err;
        }),
    });
  }

  handleFilterChange(key, value) {
    const { activeFilters } = this.urlParams;

    this.navigate({
      page: 1,
      activeFilters: {
        ...activeFilters,
        [key]: value,
      },
    });
  }

  render() {
    const { filters, groups, collapsed } = this.props;
    const { id, section, page, activeFilters } = this.urlParams;

    const view = this._view ? this._view.value : {};
    const maxPages = this.state.maxPages;

    setTitle([ 'History' ]);

    return (
      <Panel data-test="history_panel">
        <PanelView className="st2-history">
          <Toolbar title="History">
            { filters ? (
              <ToolbarFilters>
                { filters.map(({ key, label, items }) => (
                  <Filter
                    key={key}
                    label={label}
                    items={items}
                    activeItems={activeFilters[key] || []}
                    onChange={(value) => this.handleFilterChange(key, value)}
                  />
                )) }
              </ToolbarFilters>
            ) : null }
            <ToolbarView>
              <View
                name="st2HistoryView"
                spec={{
                  'meta': { title: 'Meta', default: true,
                    subview: {
                      'status': { title: 'Status', default: true },
                      'type': { title: 'Type', default: true },
                      'time': { title: 'Time', default: true },
                    },
                  },
                  'action': { title: 'Action', default: true,
                    subview: {
                      'params': { title: 'Parameters', default: true },
                    },
                  },
                  'trigger': { title: 'Triggered by', default: true },
                }}
                ref={(ref) => this._view = ref}
                onChange={() => this.forceUpdate()}
              />
            </ToolbarView>
            <ToggleButton collapsed={collapsed} onClick={() => this.handleToggleAll()} />
          </Toolbar>
          <Content>
            { groups && groups.map(({ date, executions }) => {
              const title = <Time timestamp={date} format="ddd, DD MMM YYYY" />;

              return (
                <FlexTableWrapper key={date} uid={date} title={title} titleType="date">
                  { executions.map((execution) => [
                    <HistoryFlexCard
                      key={execution.id}
                      execution={execution}
                      selected={id === execution.id}
                      view={view}
                      onClick={() => this.handleSelect(execution.id)}
                      onToggleExpand={() => this.handleExpandChildren(execution.id, !execution.fetchedChildren)}
                      displayUTC={this.state.displayUTC}
                      handleToggleUTC={() => this.handleToggleUTC()}
                    />,
                    execution.fetchedChildren ? (
                      <div
                        className="st2-history-child"
                        key={`${execution.id}-children`}
                      >
                        { execution.fetchedChildren.map((execution) => (
                          <HistoryFlexCard
                            key={execution.id}
                            isChild
                            execution={execution}
                            selected={id === execution.id}
                            view={view}
                            onClick={() => this.handleSelect(execution.id)}
                            displayUTC={this.state.displayUTC}
                            handleToggleUTC={() => this.handleToggleUTC()}
                          />
                        ))}
                      </div>
                    ) : null,
                  ]) }
                </FlexTableWrapper>
              );
            }) }

            { groups ? ( groups.length > 0 ? (
              <PanelNavigation>
                <Button
                  className={cx({
                    'st2-forms__button-prev': true,
                    'st2-forms__button-prev--disabled': page <= 1,
                  })}
                  value="Previous"
                  onClick={() => this.handlePage(page - 1)}
                />
                <Button
                  className={cx({
                    'st2-forms__button-next': true,
                    'st2-forms__button-next--disabled': page >= maxPages,
                  })}
                  value="Next"
                  onClick={() => this.handlePage(page + 1)}
                />
              </PanelNavigation>
            ) : (
              <ContentEmpty />
            ) ) : null }
          </Content>
        </PanelView>

        <HistoryDetails
          ref={(ref) => this._details = ref}
          handleNavigate={(...args) => this.navigate(...args)}
          handleRerun={(...args) => this.handleRerun(...args)}
          handleCancel={(...args) => this.handleCancel(...args)}
          provideRefresh={(fn) => this._refreshDetails = fn}

          id={id}
          section={section}
          displayUTC={this.state.displayUTC}
          handleToggleUTC={() => this.handleToggleUTC()}
        />
      </Panel>
    );
  }
}

function parseSearch(search) {
  const { page, ...activeFilters } = qs.parse(search.slice(1));

  for (const key in activeFilters) {
    activeFilters[key] = activeFilters[key].split(',').map(v => v.trim()).filter(v => v);

    if (activeFilters[key].length === 0) {
      delete activeFilters[key];
    }
  }

  return {
    page: +page || 1,
    activeFilters,
  };
}

function stringifySearch(page, activeFilters) {
  const query = {};

  if (page) {
    query.page = page;
  }

  for (const key in activeFilters) {
    const value = activeFilters[key].join(',');
    if (value) {
      query[key] = value;
    }
  }

  if (Object.keys(query).length === 0) {
    return undefined;
  }

  return qs.stringify(query);
}
