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
import fp from 'lodash/fp';

import get from 'lodash/fp/get';
import isEqual from 'lodash/fp/isEqual';

import cx from 'classnames';
import qs from 'querystring';
import api from '@stackstorm/module-api';
import {
  actions as flexActions,
} from '@stackstorm/module-flex-table/flex-table.reducer';
import notification from '@stackstorm/module-notification';
import setTitle from '@stackstorm/module-title';
import FlexTable from '@stackstorm/module-flex-table';
import Button from '@stackstorm/module-forms/button.component';
import {
  Panel,
  PanelView,
  PanelNavigation,
  Toolbar,
  Content,
  ContentEmpty,
  ToggleButton,
} from '@stackstorm/module-panel';
import formStyle from '@stackstorm/module-forms/style.pcss';

import InquiryDetails from './inquiry-details.component';
import InquiryFlexCard from './inquiry-flex-card.component';

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
  const { inquiries, collapsed } = state;
  return { inquiries, collapsed };
})
export default class InquiryPanel extends React.Component {
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

    inquiries: PropTypes.array,
    collapsed: PropTypes.bool,
  }

  state = {
    maxPages: 0,
  }

  componentDidMount() {
    const { page } = this.urlParams;
    this.fetchInquiries({ page });
  }

  componentDidUpdate(prevProps) {
    const { page } = parseSearch(get('location.search', this.props));
    const prev = parseSearch(get('location.search', prevProps));

    if (isEqual(page, prev.page)) {
      return;
    }

    this.fetchInquiries({ page });
  }

  fetchInquiries({ page = 1 }) {
    return store.dispatch({
      type: 'FETCH_INQUIRIES',
      promise: api.request({
        path: '/executions',
        query: {
          runner: 'inquirer',
          limit: PER_PAGE,
          offset: PER_PAGE * (page - 1),
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
        .then(res => {
          return res.map(execution => {
            const { id, status, result } = execution;
            return {
              ...result,
              id,
              status,
            };
          });
        })
        .catch((err) => {
          notification.error('Unable to retrieve inquiries.', { err });
          throw err;
        }),
    })
    // .then(() => {
    //   const { ref: urlRef } = this.props.match.params;
    //   const { id: ref } = this.urlParams;
    //   const { groups } = this.props;

    //   if (!urlRef && ref && groups && !groups.some(({ executions }) => executions.some(({ id }) => id === ref))) {
    //     this.navigate({ id: false });
    //   }
    // })
    ;
  }

  get urlParams() {
    const {
      ref = get('groups[0].inquiries[0].id', this.props),
      section = 'general',
    } = this.props.match.params;
    const {
      page,
    } = parseSearch(get('location.search', this.props));

    return {
      id: ref,
      section,
      page,
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

    const pathname = `/inquiry${id ? `/${id}${section ? `/${section}` : ''}` : ''}`;
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

  handleToggleAll() {
    return store.dispatch(flexActions.toggleAll());
  }

  render() {
    const { inquiries, collapsed } = this.props;
    const { id, section, page } = this.urlParams;

    const view = this._view ? this._view.value : {};
    const maxPages = this.state.maxPages;

    setTitle([ 'Inquiries' ]);

    return (
      <Panel data-test="inquiry_panel" detailed>
        <PanelView className="st2-inquiry">
          <Toolbar title="Inquiries">
            <ToggleButton collapsed={collapsed} onClick={() => this.handleToggleAll()} />
          </Toolbar>
          <Content>
            { inquiries && fp.flow(
              fp.groupBy('status'),
              fp.entries,
              fp.map(([ name, values ]) => (
                <FlexTableWrapper key={name} uid={name} title={name}>
                  { values && values.map((inquiry) => (
                    <InquiryFlexCard
                      key={inquiry.id}
                      inquiry={inquiry}
                      selected={id}
                      view={view}
                      onSelect={(id) => this.handleSelect(id)}
                    />
                  )) }
                </FlexTableWrapper>
              ))
            )(inquiries)}
            
            { inquiries ? ( inquiries.length > 0 ? (
              <PanelNavigation>
                <Button
                  className={cx(formStyle.button, formStyle.flat, formStyle.prev, page <= 1 && formStyle.disabled)}
                  value="Newer"
                  flat
                  onClick={() => this.handlePage(page - 1)}
                />
                <Button
                  className={cx(formStyle.button, formStyle.flat, formStyle.next, page >= maxPages && formStyle.disabled)}
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

        <InquiryDetails
          ref={(ref) => this._details = ref}
          handleNavigate={(...args) => this.navigate(...args)}

          id={id}
          section={section}
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
