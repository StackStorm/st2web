import { createScopedStore } from '@stackstorm/module-store';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const actionReducer = (state = {}, action) => {
  let {
    actions = {},
    executions = [],
    selected = undefined
  } = state;

  state = {
    ...state,
    actions,
    executions,
    selected
  };

  switch (action.type) {
    case 'FETCH_ACTIONS': {
      actions = { ...actions };

      switch(action.status) {
        case 'success':
          _.forEach(action.payload, item => {
            actions[item.ref] = item;
          });

          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        actions,
        selected: state.selected || Object.keys(actions).sort()[0]
      };
    }

    case 'SELECT_ACTION':
      executions = [];
      const { ref } = action;

      switch(action.status) {
        case 'success':
          executions = action.payload;

          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        selected: ref,
        executions
      };

    case 'SET_FILTER':
      const { filter } = action;

      return {
        ...state,
        filter
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
