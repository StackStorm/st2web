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

    store.dispatch(flexActions.register(uid, false));
  }
}

@connect((state) => {
  const { groups, triggers, filter, collapsed } = state;
  return { groups, triggers, filter, collapsed };
})
export default class TriggersPanel extends React.Component {
  static propTypes = {
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

  componentDidMount() {
    this.fetchGroups();
  }

  fetchGroups() {
    return Promise.all([
      store.dispatch({
        type: 'FETCH_GROUPS',
        promise: api.request({
          path: '/triggertypes',
        })
          .catch((err) => {
            notification.error('Unable to retrieve trigger types.', { err });
            throw err;
          }),
      }),
      store.dispatch({
        type: 'FETCH_SENSORS',
        promise: api.request({ path: '/sensortypes' })
          .catch((err) => {
            notification.error('Unable to retrieve sensor types.', { err });
            throw err;
          }),
      }),
    ]);
  }

  get urlParams() {
    const {
      ref = get('groups[0].triggers[0].ref', this.props),
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

    const pathname = `/triggers${id ? `/${id}${section ? `/${section}` : ''}` : ''}`;

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
