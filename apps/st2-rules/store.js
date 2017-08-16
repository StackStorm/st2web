import { createScopedStore } from '../../store.js';

import flexTableReducer from '../../modules/st2-flex-table/flex-table.reducer';

const ruleReducer = (state = {}, action) => {
  let {
    rules = {},
    selected = undefined
  } = state;

  state = {
    ...state,
    rules,
    selected
  };

  switch (action.type) {
    case 'FETCH_RULES': {
      rules = { ...rules };

      switch(action.status) {
        case 'success':
          _.forEach(action.payload, rule => {
            rules[rule.ref] = rule;
          });

          break;
        case 'error':
          break;
        default:
          break;
      }

      return { ...state, rules };
    }

    case 'SELECT_RULE':
      const { ref } = action;

      return {
        ...state,
        selected: ref || Object.keys(state.rules).sort()[0]
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
  state = ruleReducer(state, action);

  return state;
};

const store = createScopedStore('rules', reducer);

export default store;
