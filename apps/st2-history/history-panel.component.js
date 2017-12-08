import _ from 'lodash';
import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

import store from './store';
import api from '@stackstorm/module-api';
import qs from 'querystring';

import { actions as flexActions } from '@stackstorm/module-flex-table/flex-table.reducer.js';
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
import Button from '@stackstorm/module-forms/button.component';
import FlexTable from '@stackstorm/module-flex-table';
import Time from '@stackstorm/module-time';
import Filter from '@stackstorm/module-filter';
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

    store.dispatch(flexActions.register(uid));
  }
}

@connect((state) => {
  const { filters, groups, collapsed } = state;
  return { filters, groups, collapsed };
})
export default class HistoryPanel extends React.Component {
  static propTypes = {
    // notification: PropTypes.object,
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

    filters: PropTypes.object,
    groups: PropTypes.array,
    collapsed: PropTypes.bool,
  }

  state = {
    maxPages: 0,
    id: undefined,
  }

  componentDidMount() {
    let { ref: id } = this.props.match.params;
    if (!id) {
      const { groups } = this.props;
      id = groups.length > 0 && groups[0].executions.length > 0 ? groups[0].executions[0].id : undefined;
    }
    if (id !== this.state.id) {
      this.setState({ id });
    }

    store.dispatch({
      type: 'FETCH_FILTERS',
      promise: api.client.executionsFilters.list(),
    });

    const { page, activeFilters } = this.urlParams;
    this.fetchGroups({ page, activeFilters });
  }

  componentWillReceiveProps(nextProps) {
    const next = parseSearch(nextProps.location.search);
    const current = parseSearch(this.props.location.search);

    let { ref: id } = nextProps.match.params;
    if (!id) {
      const { groups } = nextProps;
      id = groups.length > 0 && groups[0].executions.length > 0 ? groups[0].executions[0].id : undefined;
    }
    if (id !== this.state.id) {
      this.setState({ id });
    }

    if (next.page !== current.page || !_.isEqual(next.activeFilters, current.activeFilters)) {
      this.fetchGroups(next);
    }
  }

  fetchGroups({ page, activeFilters }) {
    store.dispatch({
      type: 'FETCH_GROUPS',
      promise: api.client.executions.list({
        ...activeFilters,
        parent: 'null',
        limit: PER_PAGE,
        page,
      })
        .then((list) => {
          const { total, limit } = api.client.executions;
          this.setState({
            maxPages: Math.ceil(total / limit),
          });

          return list;
        }),
    })
      .then(() => {
        const { id: ref } = this.urlParams;
        const { groups } = this.props;

        if (ref && !groups.some(({ executions }) => executions.some(({ id }) => id === ref))) {
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

  handleSection(section) {
    return this.navigate({ section });
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
      }) : null,
    });
  }

  handleRerun(parameters) {
    const { id } = this.urlParams;

    return store.dispatch({
      type: 'RERUN_RULE',
      promise: api.client.executions.repeat(id, { parameters }, {
        no_merge: true,
      }),
    })
      .then(({ payload }) => {
        this.navigate({
          id: payload.id,
          section: 'general',
        });
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
            { groups.map(({ date, executions }) => {
              const title = <Time timestamp={date} format="ddd, DD MMM YYYY" />;

              return (
                <FlexTableWrapper key={date} uid={date} title={title} titleType="date">
                  { executions .map((execution) => [
                    <HistoryFlexCard
                      key={execution.id}
                      execution={execution}
                      selected={id === execution.id}
                      view={view}
                      onClick={() => this.handleSelect(execution.id)}
                      onToggleExpand={() => this.handleExpandChildren(execution.id, !execution.fetchedChildren)}
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
                          />
                        ))}
                      </div>
                    ) : null,
                  ]) }
                </FlexTableWrapper>
              );
            }) }

            { groups.length > 0 ? (
              <PanelNavigation>
                <Button
                  className={`st2-forms__button-prev ${page > 1 ? '' : 'st2-forms__button-prev--disabled'}`}
                  value="Previous"
                  onClick={() => this.handlePage(page - 1)}
                />
                <Button
                  className={`st2-forms__button-next ${page < maxPages ? '' : 'st2-forms__button-next--disabled'}`}
                  value="Next"
                  onClick={() => this.handlePage(page + 1)}
                />
              </PanelNavigation>
            ) : (
              <ContentEmpty />
            ) }
          </Content>
        </PanelView>

        <HistoryDetails
          handleNavigate={(...args) => this.navigate(...args)}
          handleRerun={(...args) => this.handleRerun(...args)}
          id={id}
          section={section}
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
