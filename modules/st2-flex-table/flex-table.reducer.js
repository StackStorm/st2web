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
      const { title, collapsed: initial = collapsed } = action;

      return {
        ...state,
        tables: {
          ...tables,
          [title]: {
            ...tables[title],
            collapsed: initial,
          },
        },
      };
    }

    case 'TOGGLE_FLEX_TABLE': {
      const { title } = action;

      const newTables = {
        ...tables,
        [title]: {
          ...tables[title],
          collapsed: typeof action.collapsed === 'boolean' ? action.collapsed : !(tables[title] || state).collapsed,
        },
      };

      if (_.some(newTables, item => item.collapsed === newTables[title].collapsed)) {
        collapsed = newTables[title].collapsed;
      }

      return {
        ...state,
        collapsed,
        tables: newTables,
      };
    }

    case 'TOGGLE_ALL': {
      const uniqueStates = _(tables).map('collapsed').unique().value();
      if (uniqueStates.length === 1) {
        collapsed = uniqueStates[0];
      }

      collapsed = !collapsed;
      tables = _.mapValues(tables, v => ({ ...v, collapsed }));

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
