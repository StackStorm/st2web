// Copyright 2019 Extreme Networks, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import store from './store';

import get from 'lodash/fp/get';
import isEqual from 'lodash/fp/isEqual';
import mapValues from 'lodash/fp/mapValues';

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
  ToolbarSearch,
  ToolbarView,
  Content,
  ContentEmpty,
  ToggleButton,
} from '@stackstorm/module-panel';
import Time from '@stackstorm/module-time';
import View from '@stackstorm/module-view';
import HistoryDetails from './history-details.component';
import HistoryFlexCard from './history-flex-card.component';

import router from '@stackstorm/module-router';

import './style.css';

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
  const { filter, filters, childExecutions, groups, collapsed } = state;
  return { filter, filters, childExecutions, groups, collapsed };
})
export default class HistoryPanel extends React.Component {
  static propTypes = {
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

    filter: PropTypes.string,
    filters: PropTypes.array,
    childExecutions: PropTypes.object,
    groups: PropTypes.array,
    collapsed: PropTypes.bool,
  }

  state = {
    maxPages: 0,
    displayUTC: false,
    advanced: false,
  }

  componentDidMount() {
    api.listen().then((source) => {
      this._source = source;

      this._executionCreateListener = (e) => {
        const record = JSON.parse(e.data);

        store.dispatch({
          type: 'CREATE_EXECUTION',
          record,
        });
      };

      this._executionUpdateListener = (e) => {
        const record = JSON.parse(e.data);

        store.dispatch({
          type: 'UPDATE_EXECUTION',
          record,
        });
      };

      this._executionDeleteListener = (e) => {
        const record = JSON.parse(e.data);

        store.dispatch({
          type: 'DELETE_EXECUTION',
          record,
        });
      };

      this._source.addEventListener('st2.execution__create', this._executionCreateListener);
      this._source.addEventListener('st2.execution__update', this._executionUpdateListener);
      this._source.addEventListener('st2.execution__delete', this._executionDeleteListener);
    });

    const { page, activeFilters } = this.urlParams;
    this.fetchGroups({ page, activeFilters });

    store.dispatch({
      type: 'FETCH_FILTERS',
      promise: api.request({ path: '/executions/views/filters' })
        .catch((err) => {
          notification.error('Unable to retrieve history.', { err });
          throw err;
        }),
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const { filter } = this.props;
    const { page, activeFilters } = parseSearch(get('location.search', this.props));
    const prev = parseSearch(get('location.search', prevProps));

    if (
      isEqual(page, prev.page) &&
      isEqual(activeFilters, prev.activeFilters) &&
      isEqual(filter, prevProps.filter)
    ) {
      return;
    }

    if (filter) {
      const tokens = filter.split(' ');
      if (!tokens.length) {
        return;
      }
  
      for (const token of tokens) {
        const [ , v ] = token.split(':');
        if (!v) {
          return;
        }
      }
    }

    this.fetchGroups({ page, activeFilters, filter });
  }

  componentWillUnmount() {
    this._source.removeEventListener('st2.execution__create', this._executionCreateListener);
    this._source.removeEventListener('st2.execution__update', this._executionUpdateListener);
    this._source.removeEventListener('st2.execution__delete', this._executionDeleteListener);
  }

  fetchGroups({ page = 1, activeFilters, filter }) {
    return store.dispatch({
      type: 'FETCH_GROUPS',
      promise: api.request({
        path: '/executions',
        query: {
          ...mapValues(f => f[0], activeFilters),
          parent: 'null',
          limit: PER_PAGE,
          offset: PER_PAGE * (page - 1),
          filter,
          include_attributes: [
            'id',
            'status',
            'start_timestamp',
            'action.ref',
            'action.name',
            'action.runner_type',
            'action.parameters',
            'parameters',
            'rule.ref',
            'trigger.type',
            'context.user',
          ],
        },
        raw: true, // so we can extract headers
      })
        .then((res) => {
          const total = res.headers['x-total-count'] || res.data.length;
          const limit = res.headers['x-limit'] || PER_PAGE;
          this.setState({
            maxPages: Math.ceil(total / limit),
          });

          return res.data;
        })
        .catch((err) => {
          notification.error('Unable to retrieve history.', { err });
          throw err;
        }),
    })
      .then(() => {
        const { ref: urlRef } = this.props.match.params;
        const { id: ref } = this.urlParams;
        const { groups } = this.props;

        if (!urlRef && ref && groups && !groups.some(({ executions }) => executions.some(({ id }) => id === ref))) {
          this.navigate({ id: false });
        }
      })
    ;
  }

  get urlParams() {
    const {
      ref = get('groups[0].executions[0].id', this.props),
      section = 'general',
    } = this.props.match.params;
    const {
      page,
      activeFilters,
    } = parseSearch(get('location.search', this.props));

    return {
      id: ref,
      section,
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

    router.push({ search, pathname });
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
      promise: expanded ? api.request({
        path: '/executions',
        query: {
          parent: id,
          exclude_attributes: 'result,trigger_instance',
        },
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
      promise: api.request({
        method: 'post',
        path: `/executions/${id}/re_run`,
        query: {
          no_merge: true,
        },
      }, {
        parameters,
      })
        .then((execution) => {
          notification.success(`Execution of action "${execution.action.ref}" has been rerun successfully.`);

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
      promise: api.request({
        method: 'delete',
        path: `/executions/${id}`,
      })
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

  handleFilterStringChange(value) {
    return store.dispatch({
      type: 'UPDATE_FILTER',
      value,
    });
  }

  render() {
    const { filter, filters, childExecutions, groups, collapsed } = this.props;
    const { id, section, page, activeFilters } = this.urlParams;

    const view = this._view ? this._view.value : {};
    const maxPages = this.state.maxPages;

    setTitle([ 'History' ]);

    const { advanced } = this.state;

    return (
      <Panel data-test="history_panel">
        <PanelView className="st2-history">
          <Toolbar title="History">
            <ToolbarSearch
              title="Filter"
              value={filter || ''}
              hidden={!advanced}
              onChange={({ target: { value }}) => this.handleFilterStringChange(value)}
              onToggle={() => this.setState({ advanced: !advanced })}
            />
            { filters ? (
              <ToolbarFilters
                hidden={advanced}
              >
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
                  { executions.map((execution) => (
                    <HistoryFlexCard
                      key={execution.id}
                      execution={execution}
                      childExecutions={childExecutions}
                      selected={id}
                      view={view}
                      onSelect={(id) => this.handleSelect(id)}
                      onToggleExpand={(...args) => this.handleExpandChildren(...args)}
                      displayUTC={this.state.displayUTC}
                      handleToggleUTC={() => this.handleToggleUTC()}
                    />
                  )) }
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
                  value="Newer"
                  flat
                  onClick={() => this.handlePage(page - 1)}
                />
                <Button
                  className={cx({
                    'st2-forms__button-next': true,
                    'st2-forms__button-next--disabled': page >= maxPages,
                  })}
                  value="Older"
                  flat
                  onClick={() => this.handlePage(page + 1)}
                />
              </PanelNavigation>
            ) : (
              <ContentEmpty />
            ) ) : null }
          </Content>
        </PanelView>

        <HistoryDetails
          handleNavigate={(...args) => this.navigate(...args)}
          handleRerun={(...args) => this.handleRerun(...args)}
          handleCancel={(...args) => this.handleCancel(...args)}

          id={id}
          section={section}
          displayUTC={this.state.displayUTC}
          handleToggleUTC={() => this.handleToggleUTC()}
        />
      </Panel>
    );
  }
}

function parseSearch(search='') {
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
