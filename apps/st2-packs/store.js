import { createScopedStore } from '../../store.js';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const packReducer = (state = {}, action) => {
  let {
    packs = {},
    selected = undefined
  } = state;

  state = {
    ...state,
    packs,
    selected
  };

  switch (action.type) {

    case 'FETCH_INSTALLED_PACKS': {
      packs = { ...packs };

      switch(action.status) {
        case 'success':
          _.forEach(action.payload, pack => {
            packs[pack.ref] = {
              ...state.packs[pack.ref],
              ...pack,
              status: 'installed'
            };
          });

          break;
        case 'error':
          break;
        default:
          break;
      }

      return { ...state, packs };
    }

    case 'FETCH_PACK_INDEX': {
      packs = { ...packs };

      switch(action.status) {
        case 'success':
          _.forEach(action.payload, pack => {
            packs[pack.ref] = {
              status: 'available',
              ...state.packs[pack.ref],
              ...pack
            };
          });

          break;
        case 'error':
          break;
        default:
          break;
      }

      return { ...state, packs };
    }

    case 'FETCH_PACK_CONFIG_SCHEMAS': {
      packs = { ...packs };

      switch(action.status) {
        case 'success':
          _.forEach(action.payload, pack => {
            packs[pack.ref] = {
              ...state.packs[pack.ref],
              ...pack
            };
          });

          break;
        case 'error':
          break;
        default:
          break;
      }

      return { ...state, packs };
    }

    case 'FETCH_PACK_CONFIGS': {
      packs = { ...packs };

      switch(action.status) {
        case 'success':
          _.forEach(action.payload, pack => {
            packs[pack.ref] = {
              ...state.packs[pack.ref],
              ...pack
            };
          });

          break;
        case 'error':
          break;
        default:
          break;
      }

      return { ...state, packs };
    }

    case 'INSTALL_PACK': {
      packs = { ...packs };

      switch(action.status) {
        case 'success':
          packs[action.ref] = { ...packs[action.ref], status: 'installed' };
          break;
        case 'error':
          packs[action.ref] = { ...packs[action.ref], status: 'available' };
          break;
        default:
          packs[action.ref] = { ...packs[action.ref], status: 'installing' };
      }

      return { ...state, packs };
    }

    case 'UNINSTALL_PACK': {
      packs = { ...packs };

      switch(action.status) {
        case 'success':
          packs[action.ref] = { ...packs[action.ref], status: 'available' };
          break;
        case 'error':
          packs[action.ref] = { ...packs[action.ref], status: 'installed' };
          break;
        default:
          packs[action.ref] = { ...packs[action.ref], status: 'uninstalling' };
      }

      return { ...state, packs };
    }

    case 'CONFIGURE_PACK': {
      packs = { ...packs };

      switch(action.status) {
        case 'success':
          packs[action.ref] = { ...packs[action.ref], config: action.payload };
          break;
        case 'error':
          break;
        default:
          break;
      }

      return { ...state, packs };
    }

    case 'SELECT_PACK':
      const { ref } = action;

      return {
        ...state,
        selected: ref || Object.keys(state.packs).sort()[0]
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
  state = packReducer(state, action);

  return state;
};

const store = createScopedStore('packs', reducer);

export default store;
