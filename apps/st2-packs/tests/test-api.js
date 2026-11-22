// Copyright 2026 The StackStorm Authors.
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

import { describe, it, beforeEach, afterEach, beforeAll, afterAll } from '@rstest/core';
import { expect } from 'chai';

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import api from '@stackstorm/module-api';

import apiPacks from '../api';

const URL = 'https://example.com/api/v1';

const INSTALLED = [
  {
    ref: 'core',
    name: 'core',
    version: '3.9.0',
    files: [ 'actions/local.yaml', 'actions/local.py', 'rules/notify.yaml', 'README.md', 'sensors/x.yaml' ],
  },
];

const INDEX = {
  core: { ref: 'core', name: 'core', version: '3.10.0', content: { actions: { count: 40 }}},
  // index entries keyed by name may come without a ref
  aws: { name: 'aws', version: '1.0.0', content: { actions: { count: 3 }}},
};

describe('packs api', () => {
  let mock;

  beforeAll(async () => {
    await api.connect();
  });
  afterAll(() => {
    api.disconnect();
  });

  beforeEach(() => {
    mock = new MockAdapter(axios);
    mock.onGet(`${URL}/packs`).reply(200, INSTALLED);
    mock.onGet(`${URL}/packs/index`).reply(200, { index: INDEX });
    mock.onGet(`${URL}/config_schemas`).reply(200, [
      { pack: 'core', attributes: { region: { type: 'string' }}},
    ]);
    mock.onGet(`${URL}/configs`).reply(200, [
      { pack: 'core', values: { region: 'us-east-1' }},
    ]);
  });
  afterEach(() => {
    mock.restore();
  });

  describe('list', () => {
    it('merges installed packs, the index, config schemas and configs by ref', async () => {
      const packs = await apiPacks.list();

      expect(packs.map(({ ref }) => ref).sort()).to.deep.equal([ 'aws', 'core' ]);

      const core = packs.find(({ ref }) => ref === 'core');
      expect(core).to.include({ status: 'installed', installedVersion: '3.9.0' });
      expect(core.config_schema).to.deep.equal({ properties: { region: { type: 'string' }}});
      expect(core.config).to.deep.equal({ region: 'us-east-1' });

      const aws = packs.find(({ ref }) => ref === 'aws');
      expect(aws).to.include({ status: 'available', version: '1.0.0' });
      expect(aws.installedVersion).to.be.undefined;

      expect(mock.history.get.find(({ url }) => url === `${URL}/configs`).params)
        .to.deep.equal({ show_secrets: true });
    });

    it('counts yaml content files for packs that come without content', async () => {
      mock.onGet(`${URL}/packs/index`).reply(200, { index: {}});

      const [ core ] = await apiPacks.list();

      expect(core.content).to.deep.equal({
        actions: { count: 1 },
        rules: { count: 1 },
        sensors: { count: 1 },
      });
    });
  });

  describe('get', () => {
    it('resolves a listed pack and rejects an unknown one with a 404', async () => {
      await apiPacks.list();

      expect(await apiPacks.get('aws')).to.include({ ref: 'aws', status: 'available' });

      let error;
      await apiPacks.get('missing').catch((err) => error = err);
      expect(error).to.include({ name: 'APIError', status: 404 });
      expect(error.message).to.contain('"missing"');
    });
  });

  describe('changes', () => {
    beforeEach(async () => {
      await apiPacks.list();
    });

    it('installs a pack and marks it installed', async () => {
      mock.onPost(`${URL}/packs/install`).reply(200, { execution_id: 'e1' });

      const res = await apiPacks.install('aws');

      expect(JSON.parse(mock.history.post[0].data)).to.deep.equal({ packs: [ 'aws' ]});
      expect(res).to.deep.equal({ execution_id: 'e1', ref: 'aws', status: 'installed' });
      expect(await apiPacks.get('aws')).to.include({ status: 'installed', execution_id: 'e1' });
    });

    it('uninstalls a pack and marks it available', async () => {
      mock.onPost(`${URL}/packs/uninstall`).reply(200, { execution_id: 'e2' });

      const res = await apiPacks.uninstall('core');

      expect(JSON.parse(mock.history.post[0].data)).to.deep.equal({ packs: [ 'core' ]});
      expect(res).to.include({ ref: 'core', status: 'available' });
      expect(await apiPacks.get('core')).to.include({ status: 'available' });
    });

    it('saves a pack config and keeps the saved values', async () => {
      mock.onPut(`${URL}/configs/core`).reply(200, { region: 'eu-west-1' });

      const res = await apiPacks.save('core', { region: 'eu-west-1' });

      const [ request ] = mock.history.put;
      expect(JSON.parse(request.data)).to.deep.equal({ region: 'eu-west-1' });
      expect(request.params).to.deep.equal({ show_secrets: true });
      expect(res).to.deep.equal({ ref: 'core', config: { region: 'eu-west-1' }});
      expect((await apiPacks.get('core')).config).to.deep.equal({ region: 'eu-west-1' });
    });

    it('rejects when the API call fails', async () => {
      mock.onPost(`${URL}/packs/install`).reply(500, { faultstring: 'nope' });

      let error;
      await apiPacks.install('aws').catch((err) => error = err);

      expect(error.response.status).to.equal(500);
      expect(await apiPacks.get('aws')).to.include({ status: 'available' });
    });
  });
});
