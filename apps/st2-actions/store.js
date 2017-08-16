import { createScopedStore } from '../../store.js';

import flexTableReducer from '../../modules/st2-flex-table/flex-table.reducer';

const actionReducer = (state = {}, action) => {
  let {
    actions = {},
    selected = undefined
  } = state;

  state = {
    ...state,
    actions,
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

      return { ...state, actions };
    }

    case 'SELECT_ACTION':
      const { ref } = action;

      return {
        ...state,
        selected: ref || Object.keys(state.actions).sort()[0]
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
