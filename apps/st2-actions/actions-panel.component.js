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

import api from '@stackstorm/module-api';
import {
  actions as flexActions,
} from '@stackstorm/module-flex-table/flex-table.reducer';
import notification from '@stackstorm/module-notification';
import setTitle from '@stackstorm/module-title';

import FlexTable from '@stackstorm/module-flex-table';
import FlowLink from '@stackstorm/module-flow-link';
import PackIcon from '@stackstorm/module-pack-icon';
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

import router from '@stackstorm/module-router';

import './style.css';

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

  componentDidMount() {
    this.fetchGroups();
  }

  fetchGroups() {
    return store.dispatch({
      type: 'FETCH_GROUPS',
      promise: api.request({ 
        path: '/actions', 
        query: {
          include_attributes: [
            'ref',
            'pack',
            'name',
            'description',
            'runner_type',
          ],
        },
      })
        .catch((err) => {
          notification.error('Unable to retrieve actions.', { err });
          throw err;
        }),
    })
      .then(() => {
        const { id } = this.urlParams;
        const { groups } = this.props;

        if (id && groups && !groups.some(({ actions }) => actions.some(({ ref }) => ref === id))) {
          this.navigate({ id: false });
        }
      })
    ;
  }

  get urlParams() {
    const {
      ref = get('groups[0].actions[0].ref', this.props),
      section = 'general',
    } = this.props.match.params;

    return {
      id: ref,
      section,
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

    router.push({ pathname });
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
    return store.dispatch({
      type: 'RUN_ACTION',
      promise: api.request({
        method: 'post',
        path: '/executions',
      }, {
        action: ref,
        parameters,
        context: {
          trace_context: {
            trace_tag,
          },
        },
      })
        .then((execution) => {
          notification.success(`Action "${ref}" has been scheduled successfully.`, {
            execution_id: execution.id,
          });
          return execution;
        })
        .catch((err) => {
          notification.error(`Unable to schedule action "${ref}".`, {
            err,
            execution_id: err.id,
          });
          throw err;
        }),
    });
  }

  render() {
    const { groups, filter, collapsed } = this.props;
    const { id, section } = this.urlParams;

    const view = this._view ? this._view.value : {};

    setTitle([ 'Actions' ]);

    return (
      <Panel data-test="actions_panel" detailed>
        <PanelView className="st2-actions">
          <div className="st2-panel__toolbar-actions">
            <FlowLink />
          </div>
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
            { groups && groups.map(({ pack, actions }) => {
              const icon = <PackIcon naked name={pack} />;

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

            { !groups || groups.length > 0 ? null : (
              <ContentEmpty />
            ) }
          </Content>
        </PanelView>

        <ActionsDetails
          ref={(ref) => this._details = ref}
          handleNavigate={(...args) => this.navigate(...args)}
          handleRun={(...args) => this.handleRun(...args)}

          id={id}
          section={section}
        />
      </Panel>
    );
  }
}
