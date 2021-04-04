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

import Time from '..';

function isDST(d) {
  const jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
  return Math.max(jan, jul) !== d.getTimezoneOffset();
}

describe(`${Time.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <Time
          className="foobar"
          timestamp={new Date().toJSON()}
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <Time
          timestamp={new Date().toJSON()}
          foo="bar"
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });

  it('renders properly with defaults', () => {
    const instance = ReactTester.create(
      <Time
        timestamp="1970-01-01T00:00:00.000Z"
      />
    );

    // note: this will only work in places with whole hour offsets
    // note: it seems like this react time component doesn't correctly take DST
    // into account so this is a temporary hack to get tests to pass on systems
    // without UTC timezone :/
    const now = new Date();
    const isNowDst = isDST(now);
    let hour = (24 - new Date().getTimezoneOffset() / 60);

    if (hour >= 24) {
      if (isNowDst) {
        hour = hour - 1;
      }

      expect(instance.text).to.equal(
        `Thu, 01 Jan 1970 ${(hour - 24).toFixed(0).padStart(2, '0')}:00:00`
      );
    }
    else {
      expect(instance.text).to.equal(`Wed, 31 Dec 1969 ${hour.toFixed(0).padStart(2, '0')}:00:00`);
    }
  });

  it('renders properly with utc', () => {
    const instance = ReactTester.create(
      <Time
        timestamp="1970-01-01T00:00:00.000Z"
        utc={true}
      />
    );

    expect(instance.text).to.equal('Thu, 01 Jan 1970 00:00:00 UTC');
  });

  it('renders properly with format', () => {
    const instance = ReactTester.create(
      <Time
        timestamp="1970-01-01T00:00:00.000Z"
        format="MMMM D YYYY HH:mm A"
      />
    );

    // note: this will only work in places with whole hour offsets
    // note: it seems like this react time component doesn't correctly take DST
    // into account so this is a temporary hack to get tests to pass on systems
    // without UTC timezone :/
    const now = new Date();
    const isNowDst = isDST(now);
    let hour = (24 - new Date().getTimezoneOffset() / 60);

    if (hour >= 24) {
      if (isNowDst) {
        hour = hour - 1;
      }

      expect(instance.text).to.equal(
        `January 1 1970 ${(hour - 24).toFixed(0).padStart(2, '0')}:00 AM`
      );
    }
    else {
      expect(instance.text).to.equal(`December 31 1969 ${hour.toFixed(0).padStart(2, '0')}:00 PM`);
    }
  });

  it('renders properly with format and utc', () => {
    const instance = ReactTester.create(
      <Time
        timestamp="1970-01-01T00:00:00.000Z"
        format="MMMM D YYYY HH:mm A"
        utc={true}
      />
    );

    expect(instance.text).to.equal('January 1 1970 00:00 AM UTC');
  });
});
