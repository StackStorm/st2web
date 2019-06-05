// Copyright 2019 Extreme Networks, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
    case 'FETCH_GROUPS': {
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
    }

    case 'FETCH_PACK': {
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
    }

    case 'INSTALL_PACK': {
      let targetPack = _.find(packs, { ref: input.ref });

      switch(input.status) {
        case 'success':
          targetPack = { ...targetPack, status: 'installed' };
          break;
        case 'error':
          targetPack = { ...targetPack, status: 'available' };
          break;
        default:
          targetPack = { ...targetPack, status: 'installing' };
      }

      packs = mergePacks(packs, [ targetPack ]);
      groups = makeGroups(packs, filter);

      return {
        ...state,
        pack: pack.ref === input.ref ? targetPack : pack,
        packs,
        groups,
      };
    }

    case 'UNINSTALL_PACK': {
      let targetPack = _.find(packs, { ref: input.ref });

      switch(input.status) {
        case 'success':
          targetPack = { ...targetPack, status: 'available' };
          break;
        case 'error':
          targetPack = { ...targetPack, status: 'installed' };
          break;
        default:
          targetPack = { ...targetPack, status: 'uninstalling' };
      }

      packs = mergePacks(packs, [ targetPack ]);
      groups = makeGroups(packs, filter);

      return {
        ...state,
        pack: pack.ref === input.ref ? targetPack : pack,
        packs,
        groups,
      };
    }

    case 'CONFIGURE_PACK': {
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
    }

    case 'SET_FILTER': {
      filter = input.filter;
      groups = makeGroups(packs, filter);

      return {
        ...state,
        groups,
        filter,
      };
    }

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
