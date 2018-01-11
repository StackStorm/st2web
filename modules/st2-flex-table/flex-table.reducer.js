import _ from 'lodash';

export const actions = {
  register: (title, collapsed) => ({ type: 'REGISTER_FLEX_TABLE', title, collapsed }),
  toggle: (title, collapsed) => ({ type: 'TOGGLE_FLEX_TABLE', title, collapsed }),
  toggleAll: () => ({ type: 'TOGGLE_ALL' }),
};

const flexTableReducer = (state = {}, action) => {
  let {
    tables = { ...state.tables },
    collapsed = false,
  } = state;

  state = {
    ...state,
    tables,
    collapsed,
  };

  switch (action.type) {
    case 'REGISTER_FLEX_TABLE': {
      const { title, collapsed = false } = action;

      tables = {
        ...tables,
        [title]: {
          ...tables[title],
          collapsed,
        },
      };

      return {
        ...state,
        tables,
        collapsed: getCollapsed(tables),
      };
    }

    case 'TOGGLE_FLEX_TABLE': {
      const { title } = action;

      tables = {
        ...tables,
        [title]: {
          ...tables[title],
          collapsed: typeof action.collapsed === 'boolean' ? action.collapsed : !(tables[title] || state).collapsed,
        },
      };

      return {
        ...state,
        tables,
        collapsed: getCollapsed(tables),
      };
    }

    case 'TOGGLE_ALL': {
      const uniqueStates = _(tables).map('collapsed').uniq().value();
      if (uniqueStates.length === 1) {
        collapsed = uniqueStates[0];
      }

      collapsed = !collapsed;
      tables = _.mapValues(tables, (table) => ({ ...table, collapsed }));

      return {
        ...state,
        collapsed,
        tables,
      };
    }

    default:
      return state;
  }
};

export default flexTableReducer;

function getCollapsed(tables) {
  return _.every(tables, ({ collapsed }) => collapsed === true);
}
