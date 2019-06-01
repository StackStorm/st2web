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

// Note: Due to the multitude of calls required to collect all packs, the status
// changes needed on those packs, and the lack of a universal get-pack command,
// this file creates a unified api for listing and fetching packs.

import _ from 'lodash';
import api from '@stackstorm/module-api';

let globalPacks = [];

export default {
  list() {
    return Promise.all([
      api.request({
        path: '/packs',
      })
        .then((packs) => _.map(packs, (pack) => ({
          ...pack,
          status: 'installed',
          installedVersion: pack.version,
        }))),
      api.request({
        path: '/packs/index',
      })
        .then(({ index: packs }) => _.map(packs, (pack, ref) => ({
          ...pack,
          status: 'available',

          // In some cases, pack.ref might be missing and we better sort it out earlier
          ref: pack.ref || ref,
        }))),
      api.request({
        path: '/config_schemas',
      })
        .then((packs) => _.map(packs, ({ pack, attributes }) => ({
          ref: pack,
          config_schema: {
            properties: attributes,
          },
        }))),
      api.request({
        path: '/configs',
        query: {
          show_secrets: true,
        },
      })
        .then((packs) => _.map(packs, ({ pack, values }) => ({
          ref: pack,
          config: values,
        }))),
    ])
      .then((lists) => lists.reverse().reduce((packs, list) => {
        packs = [ ...packs ];

        _.forEach(list, (pack) => {
          let found = false;
          for (const index in packs) {
            if (packs[index].ref !== pack.ref) {
              continue;
            }

            found = true;
            packs[index] = {
              ...packs[index],
              ...pack,
            };
          }

          if (!found) {
            packs.push(pack);
          }
        });

        return packs;
      }, []))
      .then((packs) => _.map(packs, (pack) => {
        if (!pack.content) {
          const types = [ 'actions', 'aliases', 'rules', 'sensors', 'tests', 'triggers' ];
          pack.files.forEach((file) => {
            const [ folder, filename ] = file.split('/');

            if (types.indexOf(folder) >= 0 && /.yaml$/.test(filename)) {
              pack.content = pack.content || {};
              pack.content[folder] = pack.content[folder] || { count: 0 };
              pack.content[folder].count = pack.content[folder].count + 1;
            }
          });
        }

        return pack;
      }))
      .then((packs) => globalPacks = packs)
    ;
  },
  get(id) {
    const pack = globalPacks.find(({ ref }) => ref === id);
    if (pack) {
      return Promise.resolve(pack);
    }

    return Promise.reject({
      name: 'APIError',
      status: 404,
      message: `Resource with a ref or id "${id}" not found`,
    });
  },
  install(id) {
    return api.request({
      method: 'post',
      path: '/packs/install',
    }, { packs: [ id ] })
      .then((pack) => mergePack({ ...pack, ref: id, status: 'installed' }))
    ;
  },
  uninstall(id) {
    return api.request({
      method: 'post',
      path: '/packs/uninstall',
    }, { packs: [ id ] })
      .then((pack) => mergePack({ ...pack, ref: id, status: 'available' }))
    ;
  },
  save(id, pack) {
    return api.request({
      method: 'put',
      path: `/configs/${id}`,
      query: {
        show_secrets: true,
      },
    }, pack)
      .then((res) => ({ ref: id, config: res }))
      .then(mergePack)
    ;
  },
};

function mergePack(pack) {
  for (const index in globalPacks) {
    if (globalPacks[index].ref !== pack.ref) {
      continue;
    }

    globalPacks[index] = {
      ...globalPacks[index],
      ...pack,
    };
  }

  return pack;
}
