import _ from 'lodash';
import { createScopedStore } from '@stackstorm/module-store';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const packReducer = (state = {}, input) => {
  let {
    packs = [],
    groups = null,
    filter = '',
    pack = undefined,
  } = state;

  state = {
    ...state,
    packs,
    groups,
    filter,
    pack,
  };

  switch (input.type) {
    case 'FETCH_GROUPS':
      switch(input.status) {
        case 'success':
          packs = input.payload;
          groups = makeGroups(packs, filter);
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        packs,
        groups,
      };

    case 'FETCH_PACK':
      switch(input.status) {
        case 'success':
          pack = input.payload;
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        pack,
      };

    case 'INSTALL_PACK':
      switch(input.status) {
        case 'success':
          packs = mergePacks(packs, [{ ref: input.ref, status: 'installed' }]);
          break;
        case 'error':
          packs = mergePacks(packs, [{ ref: input.ref, status: 'available' }]);
          break;
        default:
          packs = mergePacks(packs, [{ ref: input.ref, status: 'installing' }]);
      }

      groups = makeGroups(packs, filter);

      return {
        ...state,
        packs,
        groups,
      };

    case 'UNINSTALL_PACK':
      switch(input.status) {
        case 'success':
          packs = mergePacks(packs, [{ ref: input.ref, status: 'available' }]);
          break;
        case 'error':
          packs = mergePacks(packs, [{ ref: input.ref, status: 'installed' }]);
          break;
        default:
          packs = mergePacks(packs, [{ ref: input.ref, status: 'uninstalling' }]);
      }

      groups = makeGroups(packs, filter);

      return {
        ...state,
        packs,
        groups,
      };

    case 'CONFIGURE_PACK':
      switch(input.status) {
        case 'success':
          // Note: `input.payload` is undefined?
          // packs = mergePacks(packs, [ input.payload ]);
          // groups = makeGroups(packs, filter);
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
      };

    case 'SET_FILTER':
      filter = input.filter;
      groups = makeGroups(packs, filter);

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
  state = packReducer(state, action);

  return state;
};

const store = createScopedStore('packs', reducer);

export default store;

function makeGroups(actions, filter) {
  const groups = _(actions)
    .filter(({ ref }) => ref.toLowerCase().indexOf(filter.toLowerCase()) > -1)
    .sortBy('ref')
    .groupBy('status')
    .value()
  ;

  const statuses = [ 'installed', 'installing', 'uninstalling', 'available' ];
  return Object
    .keys(groups)
    .sort(((a, b) => statuses.indexOf(a) - statuses.indexOf(b)))
    .map((status) => ({ status, packs: groups[status] }))
  ;
}

function mergePacks(target, source, override) {
  target = [ ...target ];

  _.forEach(source, (pack) => {
    let found = false;
    for (const index in target) {
      if (target[index].ref !== pack.ref) {
        continue;
      }

      found = true;
      target[index] = {
        ...target[index],
        ...pack,
        ...override,
      };
    }

    if (!found) {
      target.push({
        ...pack,
        ...override,
      });
    }
  });

  return target;
}
