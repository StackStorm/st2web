import { createScopedStore } from '@stackstorm/module-store';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const packReducer = (state = {}, input) => {
  let {
    packs = {},
    filter = '',
    selected = undefined,
  } = state;

  state = {
    ...state,
    packs,
    filter,
    selected,
  };

  switch (input.type) {

    case 'FETCH_INSTALLED_PACKS': {
      packs = { ...packs };

      switch(input.status) {
        case 'success':
          _.forEach(input.payload, (pack) => {
            packs[pack.ref] = {
              ...state.packs[pack.ref],
              ...pack,
              status: 'installed',
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

      switch(input.status) {
        case 'success':
          _.forEach(input.payload, (pack) => {
            packs[pack.ref] = {
              status: 'available',
              ...state.packs[pack.ref],
              ...pack,
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

      switch(input.status) {
        case 'success':
          _.forEach(input.payload, (pack) => {
            packs[pack.ref] = {
              ...state.packs[pack.ref],
              ...pack,
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

      switch(input.status) {
        case 'success':
          _.forEach(input.payload, (pack) => {
            packs[pack.ref] = {
              ...state.packs[pack.ref],
              ...pack,
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

      switch(input.status) {
        case 'success':
          packs[input.ref] = { ...packs[input.ref], status: 'installed' };
          break;
        case 'error':
          packs[input.ref] = { ...packs[input.ref], status: 'available' };
          break;
        default:
          packs[input.ref] = { ...packs[input.ref], status: 'installing' };
      }

      return { ...state, packs };
    }

    case 'UNINSTALL_PACK': {
      packs = { ...packs };

      switch(input.status) {
        case 'success':
          packs[input.ref] = { ...packs[input.ref], status: 'available' };
          break;
        case 'error':
          packs[input.ref] = { ...packs[input.ref], status: 'installed' };
          break;
        default:
          packs[input.ref] = { ...packs[input.ref], status: 'uninstalling' };
      }

      return { ...state, packs };
    }

    case 'CONFIGURE_PACK': {
      packs = { ...packs };

      switch(input.status) {
        case 'success':
          packs[input.ref] = { ...packs[input.ref], config: input.payload };
          break;
        case 'error':
          break;
        default:
          break;
      }

      return { ...state, packs };
    }

    case 'SELECT_PACK':
      const { ref } = input;
      selected = ref || Object.keys(state.packs).sort()[0];

      return {
        ...state,
        selected,
      };

    case 'SET_FILTER':
      filter = input.filter;

      return {
        ...state,
        filter,
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
