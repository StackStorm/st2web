import { createScopedStore } from '@stackstorm/module-store';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const historyReducer = (state = {}, action) => {
  let {
    executions = {},
    selected = undefined
  } = state;

  state = {
    ...state,
    executions,
    selected
  };

  switch (action.type) {
    case 'FETCH_EXECUTIONS': {
      executions = { ...executions };

      switch(action.status) {
        case 'success':
          executions = action.payload;

          break;
        case 'error':
          break;
        default:
          break;
      }

      return { ...state, executions };
    }

    case 'SELECT_EXECUTION':
      const { ref } = action;

      return {
        ...state,
        selected: ref || Object.keys(state.executions).sort()[0]
      };

    default:
      return state;
  }
};

const reducer = (state = {}, action) => {
  state = flexTableReducer(state, action);
  state = historyReducer(state, action);

  return state;
};

const store = createScopedStore('history', reducer);

export default store;
