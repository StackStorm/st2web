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

import { describe, it, beforeAll, afterAll } from '@rstest/core';
import { expect } from 'chai';

import { act } from 'react';
import { renderNode } from '@stackstorm/module-test-utils';

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import api from '@stackstorm/module-api';

import PackIcon from '..';

describe(`${PackIcon.name} Component`, () => {
  let mock;

  beforeAll(async () => {
    mock = new MockAdapter(axios);
    mock.onGet('https://example.com/api/v1/packs').reply(200, []);
    // the component loads pack icons from the API on mount
    await api.connect();
  });
  afterAll(() => {
    mock.restore();
    api.disconnect();
  });

  // PackIcon re-renders once the shared /packs request settles; let that happen inside act().
  const iconsLoaded = () => act(() => new Promise(resolve => setTimeout(resolve)));

  describe('common functionality', () => {

    it('proxies className', async () => {
      const instance = renderNode(
        <PackIcon
          className="foobar"
        />
      );
      await iconsLoaded();

      expect(instance.classList.contains('foobar')).to.be.true;
    });

    it('proxies extra props', async () => {
      const instance = renderNode(
        <PackIcon
          foo="bar"
        />
      );
      await iconsLoaded();

      expect(instance.getAttribute('foo')).to.equal('bar');
    });
  });
});
