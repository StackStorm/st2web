import _ from 'lodash';

import { createStore } from 'redux';

const initialState = {
  collapsed: false,
  tables: {},
  packs: {},
  selected: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {

    case 'REGISTER_FLEX_TABLE': {
      const { tables, collapsed } = state;
      const { title } = action;

      return {
        ...state,
        tables: {
          ...tables,
          [title]: {
            ...tables[title],
            collapsed
          }
        }
      };
    }

    case 'TOGGLE_FLEX_TABLE': {
      const { tables } = state;
      const { title } = action;

      const newTables = {
        ...tables,
        [title]: {
          ...tables[title],
          collapsed: !(tables[title] || state).collapsed
        }
      };

      let { collapsed } = state;

      if (_.some(newTables, item => item.collapsed === newTables[title].collapsed)) {
        collapsed = newTables[title].collapsed;
      }

      return {
        ...state,
        collapsed,
        tables: newTables
      };
    }

    case 'TOGGLE_ALL': {
      let { collapsed, tables } = state;

      collapsed = !collapsed;
      tables = _.mapValues(tables, v => ({ ...v, collapsed }));

      return {
        ...state,
        collapsed,
        tables
      };
    }

    case 'FETCH_INSTALLED_PACKS':

      switch(action.status) {
        case 'success':
          const [ firstAction = {} ] = action.payload;
          const { selected = firstAction.ref } = state;

          const { packs } = state;
          const installedPacks = {};

          action.payload.forEach(pack => {
            installedPacks[pack.ref] = {
              ...pack,
              installed: true
            };
          });

          return {
            ...state,
            selected,
            packs: {
              ...packs,
              ...installedPacks
            }
          };
        case 'error':
          return {
            ...state
          };
        default:
          return {
            ...state
          };
      }

    case 'FETCH_PACK_INDEX':

      switch(action.status) {
        case 'success':
          const { packs } = state;

          return {
            ...state,
            packs: {
              ...packs,
              ...action.payload
            }
          };
        case 'error':
          return {
            ...state
          };
        default:
          return {
            ...state
          };
      }

      return {
        ...state
      };

    case 'SELECT_PACK':

      return {
        ...state,
        selected: action.ref
      };

    default:
      return state;
  }
};

const store = createStore(
  reducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

export default store;
