import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

import { Link } from 'react-router-dom';

import store from './store';
import api from '@stackstorm/module-api';
import qs from 'querystring';

import { actions as flexActions } from '@stackstorm/module-flex-table/flex-table.reducer.js';
import {
  Panel,
  PanelView,
  PanelDetails,
  PanelNavigation,
  Toolbar,
  ToolbarFilters,
  ToolbarView,
  Content,
  DetailsHeader,
  DetailsSwitch,
  DetailsBody,
  DetailsPanel,
  DetailsPanelHeading,
  DetailsPanelBody,
  DetailsPanelBodyLine,
  // DetailsButtonsPanel,
  DetailsToolbar,
  DetailsToolbarSeparator,
  ToggleButton,
} from '@stackstorm/module-panel';
import Button from '@stackstorm/module-forms/button.component';
import FlexTable from '@stackstorm/module-flex-table';
import AutoForm from '@stackstorm/module-auto-form';
import St2Highlight from '@stackstorm/module-highlight';
import Time from '@stackstorm/module-time';
import Label from '@stackstorm/module-label';
import ActionReporter from '@stackstorm/module-action-reporter';
import selectOnClick from '@stackstorm/module-select-on-click';
import Filter from '@stackstorm/module-filter';
import View from '@stackstorm/module-view';

import HistoryFlexCard from './history-flex-card.component';
import HistoryPopup from './history-popup.component';

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
  const { filters, activeFilters, groups, execution, collapsed } = state;
  return { filters, activeFilters, groups, execution, collapsed };
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
    activeFilters: PropTypes.object,
    groups: PropTypes.array,
    execution: PropTypes.object,
    collapsed: PropTypes.bool,
  }

  state = {
    maxPages: 0,
  }

  componentDidMount() {
    store.dispatch({
      type: 'FETCH_FILTERS',
      promise: api.client.executionsFilters.list(),
    });

    const { ref, page } = this.urlParams;
    const activeFilters = this.props.activeFilters;

    store.dispatch({
      type: 'FETCH_GROUPS',
      activeFilters,
      promise: api.client.executions.list({
        parent: 'null',
        limit: PER_PAGE,
        page,
        ...activeFilters,
      }).then((list) => {
        const { total, limit } = api.client.executions;
        this.setState({
          maxPages: Math.ceil(total / limit),
        });

        return list;
      }),
    })
      .then(() => {
        let { ref, execution } = store.getState();

        if (!execution) {
          ref = this.urlParams.ref || ref;

          store.dispatch({
            type: 'FETCH_EXECUTION',
            promise: api.client.executions.get(ref),
          }).then(() => {
            this.navigate();
          });
        }
      })
    ;

    store.dispatch({ type: 'SELECT_EXECUTION', ref });
  }

  componentWillReceiveProps(nextProps) {
    const { groups } = store.getState();
    const { ref = groups[0].executions[0].id } = nextProps.match.params;
    const { page } = qs.parse(nextProps.location.search.slice(1));

    if (page !== qs.parse(this.props.location.search.slice(1)).page) {
      const activeFilters = this.props.activeFilters;

      store.dispatch({
        type: 'FETCH_GROUPS',
        activeFilters,
        promise: api.client.executions.list({
          ...activeFilters,
          parent: 'null',
          limit: PER_PAGE,
          page,
        }).then((list) => {
          const { total, limit } = api.client.executions;
          this.setState({
            maxPages: Math.ceil(total / limit),
          });

          return list;
        }),
      }).then(() => {
        const { groups } = store.getState();
        let ref = groups[0].executions[0].id;

        store.dispatch({
          type: 'FETCH_EXECUTION',
          promise: api.client.executions.get(ref),
        }).then(() => {
          this.navigate();
        });
      });
    }
    else if (ref !== this.props.match.params.ref) {
      store.dispatch({
        type: 'FETCH_EXECUTION',
        promise: api.client.executions.get(ref),
      }).then(() => {
        this.navigate();
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    if (nextProps.match.params.ref !== this.urlParams.ref) {
      return false;
    }

    return true;
  }

  get urlParams() {
    const { ref, section } = this.props.match.params;
    const { page, ...params } = qs.parse(this.props.location.search.slice(1));

    return {
      ref,
      section: section || 'general',
      page: +page || 1,
      params,
    };
  }

  navigate({ ref, section, page, params } = {}) {
    const current = this.urlParams;

    if (!ref) {
      ref = this.props.execution.id || undefined;
    }

    if (!section) {
      section = current.section;
    }
    if (section === 'general') {
      section = undefined;
    }

    if (!page) {
      page = current.page;
    }
    if (page === 1) {
      page = undefined;
    }

    let query = {
      ...params,
      page,
    };
    for (let key in query) {
      if (!query[key]) {
        delete query[key];
      }
    }
    if (Object.keys(query).length > 0) {
      query = qs.stringify(query);
    }
    else {
      query = undefined;
    }

    const { location } = this.props;
    const pathname = `/history/${ ref }${ section ? `/${ section }` : '' }`;
    const search = `${ query ? `?${ query }` : '' }`;

    if (location.pathname === pathname && location.search === search) {
      return;
    }

    const { history } = this.props;
    history.push(`${ pathname }${ search }`);
  }

  handleToggleAll() {
    return store.dispatch(flexActions.toggleAll());
  }

  handleSelect(ref) {
    return this.navigate({ ref });
  }

  handleSetPage(page) {
    return this.navigate({ page });
  }

  handleExpand(id, expanded) {
    return store.dispatch({
      type: 'FETCH_EXECUTION_CHILDREN',
      id,
      expanded,
      promise: expanded ? api.client.executions.list({
        parent: id,
      }) : null,
    });
  }

  handleSection(section) {
    return this.navigate({ section });
  }

  handleRerun(parameters) {
    const { execution: { id } } = this.props;

    return store.dispatch({
      type: 'DELETE_RULE',
      promise: api.client.executions.repeat(id, { parameters }, {
        no_merge: true,
      }),
    })
      .then(() => {
        this.handleSection('general');
      });
  }

  handleFilterChange(key, value) {
    const { page } = this.urlParams;
    const activeFilters = {
      ...this.props.activeFilters,
      [key]: value,
    };

    store.dispatch({
      type: 'FETCH_GROUPS',
      activeFilters,
      promise: api.client.executions.list({
        parent: 'null',
        limit: PER_PAGE,
        offset: page * PER_PAGE,
        ...activeFilters,
      }).then((list) => {
        const { total, limit } = api.client.executions;
        this.setState({
          maxPages: Math.ceil(total / limit),
        });

        return list;
      }),
    });
  }

  render() {
    const { filters, activeFilters, groups, execution, collapsed } = this.props;
    let { section, page } = this.urlParams;

    const view = this._view ? this._view.value : {};
    const maxPages = this.state.maxPages;
    const execution_time = execution && Math.ceil((new Date(execution.end_timestamp).getTime() - new Date(execution.start_timestamp).getTime()) / 1000);

    return (
      <Panel>
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
              const id = execution && execution.id;

              return (
                <FlexTableWrapper key={date} uid={date} title={title} titleType="date">
                  { executions .map(execution => [
                    <HistoryFlexCard
                      key={execution.id}
                      execution={execution}
                      selected={id === execution.id}
                      view={view}
                      onClick={() => this.handleSelect(execution.id)}
                      onToggleExpand={() => this.handleExpand(execution.id, !execution.fetchedChildren)}
                    />,
                    execution.fetchedChildren ? (
                      <div
                        className="st2-history-child"
                        key={`${execution.id}-children`}
                      >
                        { execution.fetchedChildren.map(execution => {
                          return (
                            <HistoryFlexCard
                              key={execution.id}
                              isChild
                              execution={execution}
                              selected={id === execution.id}
                              view={view}
                              onClick={() => this.handleSelect(execution.id)}
                            />
                          );
                        })}
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
                  onClick={() => this.handleSetPage(page - 1)}
                />
                <Button
                  className={`st2-forms__button-next ${page < maxPages ? '' : 'st2-forms__button-next--disabled'}`}
                  value="Next"
                  onClick={() => this.handleSetPage(page + 1)}
                />
              </PanelNavigation>
            ) : null }
          </Content>
        </PanelView>
        <PanelDetails data-test="details">
          <DetailsHeader title={execution && execution.action.ref} subtitle={execution && execution.action.description} />
          <DetailsSwitch
            sections={[
              { label: 'General', path: 'general' },
              { label: 'Code', path: 'code' },
            ]}
            current={section}
            onChange={({ path }) => this.handleSection(path)}
          />
          <DetailsBody>
            { section === 'general' && execution ? (
              <div>
                <DetailsPanel>
                  <div className="st2-action-reporter__header">
                    <DetailsPanelBody>
                      <DetailsPanelBodyLine label="Status">
                        <Label status={execution.status} />
                      </DetailsPanelBodyLine>
                      <DetailsPanelBodyLine label="Execution ID">
                        <div className="st2-action-reporter__uuid" ref={selectOnClick}>
                          { execution && execution.id }
                        </div>
                      </DetailsPanelBodyLine>
                      { execution.context && execution.context.trace_context && execution.context.trace_context.trace_tag ? (
                        <DetailsPanelBodyLine label="Trace Tag">
                          <div className="st2-action-reporter__uuid" ref={selectOnClick}>
                            { execution.context.trace_context.trace_tag }
                          </div>
                        </DetailsPanelBodyLine>
                      ) : null
                      }
                      <DetailsPanelBodyLine label="Started">
                        <Time timestamp={execution.start_timestamp} format="ddd, DD MMM YYYY HH:mm:ss" />
                      </DetailsPanelBodyLine>
                      <DetailsPanelBodyLine label="Finished">
                        <Time timestamp={execution.end_timestamp} format="ddd, DD MMM YYYY HH:mm:ss" />
                      </DetailsPanelBodyLine>
                      <DetailsPanelBodyLine label="Execution Time">
                        {execution_time}s
                      </DetailsPanelBodyLine>
                    </DetailsPanelBody>
                  </div>
                  <DetailsPanelHeading title="Action Output" />
                  <DetailsPanelBody>
                    <ActionReporter runner={execution.runner.name} execution={execution} />
                  </DetailsPanelBody>
                </DetailsPanel>
                { execution.rule ? (
                  <DetailsPanel>
                    <DetailsPanelHeading title="Rule Details" />
                    <DetailsPanelBody>
                      <DetailsPanelBodyLine label="Rule">
                        <Link to={`/rules/${execution.rule.ref}/general`}>{ execution.rule.ref }</Link>
                      </DetailsPanelBodyLine>
                      { execution.rule.description ?
                        (
                          <DetailsPanelBodyLine label="Description">
                            { execution.rule.description }
                          </DetailsPanelBodyLine>
                        )
                        : null }
                    </DetailsPanelBody>
                  </DetailsPanel>
                ) : null }
                { execution.trigger ? (
                  <DetailsPanel>
                    <DetailsPanelHeading title="Trigger Details" />
                    <DetailsPanelBody>
                      { execution.trigger.type ? (
                        <DetailsPanelBodyLine label="Trigger">
                          { execution.trigger.type }
                        </DetailsPanelBodyLine>
                      ) : null }
                      { execution.trigger_instance && execution.trigger_instance.occurrence_time ? (
                        <DetailsPanelBodyLine label="Occurrence">
                          <Time timestamp={execution.trigger_instance.occurrence_time} format="ddd, DD MMM YYYY HH:mm:ss" />
                        </DetailsPanelBodyLine>
                      ) : null }
                    </DetailsPanelBody>
                    { execution.trigger_instance && execution.trigger_instance.occurrence_time ? (
                      <DetailsPanelBody>
                        <St2Highlight code={execution.trigger_instance.payload} />
                      </DetailsPanelBody>
                    ) : null }
                  </DetailsPanel>
                ) : null }
                <DetailsPanel>
                  <DetailsPanelHeading title="Action Input" />
                  <DetailsPanelBody>
                    <form className="st2-details__form">
                      <AutoForm
                        spec={{
                          type: 'object',
                          properties: {
                            ...execution.runner.runner_parameters,
                            ...execution.action.parameters,
                          },
                        }}
                        disabled={true}
                        ngModel={execution.parameters}
                      />
                    </form>
                  </DetailsPanelBody>
                </DetailsPanel>
              </div>
            ) : null }
            { section === 'code' && execution ? (
              <DetailsPanel data-test="execution_parameters">
                <St2Highlight code={execution} />
              </DetailsPanel>
            ) : null }
          </DetailsBody>
          <DetailsToolbar>
            <Button small value="Rerun" onClick={() => this.handleSection('rerun')} />
            <Button small value="Cancel" onClick={() => this.handleCancel()} disabled={status !== 'running'} />

            <DetailsToolbarSeparator />
          </DetailsToolbar>
        </PanelDetails>

        { section === 'rerun' && execution ? (
          <HistoryPopup
            action={execution.action.ref}
            payload={execution.parameters}
            spec={{
              type: 'object',
              properties: {
                ...execution.runner.runner_parameters,
                ...execution.action.parameters,
              },
            }}

            onSubmit={(data) => this.handleRerun(data)}
            onCancel={() => this.handleSection('general')}
          />
        ) : null }
      </Panel>
    );
  }
}
