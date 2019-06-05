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

import { ReactTester } from '@stackstorm/module-test-utils';

import '@stackstorm/module-test-utils/bootstrap/storage';
import reporter from '../reporters/run-python';

describe(`ActionReporter: ${reporter.name}`, () => {
  it('works with empty object', () => {
    const instance = ReactTester.create(
      reporter({})
    );

    expect(instance.node.children.length).to.equal(1);
  });
});
