import { createScopedStore } from '@stackstorm/module-store';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const actionReducer = (state = {}, input) => {
  let {
    actions = [],
    groups = [],
    filter = '',
    ref = undefined,
    action = undefined,
    executions = [],
  } = state;

  state = {
    ...state,
    actions,
    groups,
    filter,
    ref,
    action,
    executions,
  };

  switch (input.type) {
    case 'FETCH_GROUPS':
      switch(input.status) {
        case 'success':
          actions = input.payload;

          groups = _(actions)
            .filter(({ ref }) => ref.toLowerCase().indexOf(filter.toLowerCase()) > -1)
            .sortBy('ref')
            .groupBy('pack')
            .value()
          ;
          groups = Object.keys(groups).map(pack => ({ pack, actions: groups[pack] }));

          ref = state.ref;
          if (!ref) {
            ref = groups[0].actions[0].ref;
            action = undefined;
          }
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
        ref,
        action,
      };

    case 'FETCH_ACTION':
      switch(input.status) {
        case 'success':
          action = input.payload;
          ref = action.ref;
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        ref,
        action,
      };

    case 'FETCH_EXECUTIONS':
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

    case 'SET_FILTER':
      filter = input.filter;

      groups = _(actions)
        .filter(({ ref }) => ref.toLowerCase().indexOf(filter.toLowerCase()) > -1)
        .sortBy('ref')
        .groupBy('pack')
        .value()
      ;
      groups = Object.keys(groups).map(pack => ({ pack, actions: groups[pack] }));

      return {
        ...state,
        groups,
        filter,
      };

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
