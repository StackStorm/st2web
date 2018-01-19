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
  } = state;

  state = {
    ...state,
    actions,
    groups,
    filter,
    action,
    executions,
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
          executions = input.payload;
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

    case 'CREATE_EXECUTION': {
      const { record } = input;

      executions = [ record, ...executions ];

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
        executions = [ record, ...executions ];
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
