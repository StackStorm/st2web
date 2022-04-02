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

import '@stackstorm/module-test-utils/bootstrap/storage';
import ActionReporter from '..';

describe(`${ActionReporter.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <ActionReporter
          className='foobar'
          runner='noop'
          execution={{}}
          api={{server: {api: 'https://example.com:3000/v1'}}}
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <ActionReporter
          foo='bar'
          runner='noop'
          execution={{}}
          api={{server: {api: 'https://example.com:3000/v1'}}}
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });

    it('returns correct message on large result', () => {
      const instance = ReactTester.create(
        <ActionReporter
          foo='bar'
          runner='noop'
          execution={{id: 'id1', result_size: 500 * 10244}}
          api={{server: {api: 'https://example.com:3000/v1'}}}
        />
      );

      const pElem = instance.toJSON().children[1].children.join('');
      expect(pElem).to.contain('Action output is too large to be displayed here');
      expect(pElem).to.contain('You can view raw');
    });
  });
});
