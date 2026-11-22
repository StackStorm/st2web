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

import { describe, it } from '@rstest/core';
import { expect } from 'chai';

import { renderNode } from '@stackstorm/module-test-utils';

import { DetailsHeader } from '..';

describe(`${DetailsHeader.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = renderNode(
        <DetailsHeader
          className="foobar"
          title="title"
        />
      );

      expect(instance.classList.contains('foobar')).to.be.true;
    });

    it('proxies extra props', () => {
      const instance = renderNode(
        <DetailsHeader
          foo="bar"
          title="title"
        />
      );

      expect(instance.getAttribute('foo')).to.equal('bar');
    });
  });
});
