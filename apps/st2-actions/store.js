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

import _ from 'lodash';
import { createScopedStore } from '@stackstorm/module-store';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const actionReducer = (state = {}, input) => {
  let {
    actions = [],
    groups = null,
    filter = '',
    action = undefined,
    executions = [],
    entrypoint = '',
  } = state;

  state = {
    ...state,
    actions,
    groups,
    filter,
    action,
    executions,
    entrypoint,
  };

  switch (input.type) {
    case 'FETCH_GROUPS': {
      switch(input.status) {
        case 'success':
          actions = input.payload;
          groups = makeGroups(actions, filter);
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        actions,
        groups,
      };
    }

    case 'FETCH_ACTION': {
      switch(input.status) {
        case 'success':
          action = input.payload;
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        action,
      };
    }

    case 'FETCH_EXECUTIONS': {
      switch(input.status) {
        case 'success':
          executions = _.sortBy(input.payload, 'start_timestamp');
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        executions,
      };
    }

    case 'FETCH_ENTRYPOINT': {
      switch(input.status) {
        case 'success':
          entrypoint = input.payload;
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        entrypoint,
      };
    }

    case 'CREATE_EXECUTION': {
      const { record } = input;

      const index = executions.findIndex(({ id }) => id === record.id);
      if (index === -1) {
        executions = _.sortBy([ record, ...executions ], 'start_timestamp');
      }

      return {
        ...state,
        executions,
      };
    }

    case 'UPDATE_EXECUTION': {
      const { record } = input;

      const index = executions.findIndex(({ id }) => id === record.id);
      if (index > -1) {
        executions = [ ...executions ];
        executions[index] = record;
      }
      else {
        executions = _.sortBy([ record, ...executions ], 'start_timestamp');
      }

      return {
        ...state,
        executions,
      };
    }

    case 'DELETE_EXECUTION': {
      const { record } = input;

      const index = executions.findIndex(({ id }) => id === record.id);
      if (index > -1) {
        executions = executions.filter(({ id }) => id !== record.id);
      }

      return {
        ...state,
        executions,
      };
    }

    case 'DELETE_ACTION': {
      const { ref } = input;

      

      switch(input.status) {
        case 'success':
          actions = [ ...actions ]
            .filter(action => action.ref !== ref)
          ;
          groups = makeGroups( actions, filter);

          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        actions,
        groups,
      };
    }

    case 'SET_FILTER': {
      filter = input.filter;
      groups = makeGroups(actions, filter);

      return {
        ...state,
        groups,
        filter,
      };
    }

    default:
      return state;
  }
};

const reducer = (state = {}, action) => {
  state = flexTableReducer(state, action);
  state = actionReducer(state, action);

  return state;
};

const store = createScopedStore('actions', reducer);

export default store;

function makeGroups(actions, filter) {
  const groups = _(actions)
    .filter(({ ref }) => ref.toLowerCase().indexOf(filter.toLowerCase()) > -1)
    .sortBy('ref')
    .groupBy('pack')
    .value()
  ;

  return Object.keys(groups).map((pack) => ({ pack, actions: groups[pack] }));
}
