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

import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import '@stackstorm/module-test-utils/bootstrap/misc';
import RemoteForm from '..';

describe(`${RemoteForm.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <RemoteForm
          className="foobar"
          name="name"
          spec={{
            enum: [],
          }}
          data={{}}
          onChange={() => {}}
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <RemoteForm
          foo="bar"
          name="name"
          spec={{
            enum: [],
          }}
          data={{}}
          onChange={() => {}}
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
