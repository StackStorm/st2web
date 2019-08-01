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
import sinon from 'sinon';

import '@stackstorm/module-test-utils/bootstrap/events';
import proportional from '..';

describe('proportional', () => {
  let spyAdd;
  let spyRemove;
  let makeProportional;
  before(() => {
    spyAdd = sinon.spy(global.window, 'addEventListener');
    spyRemove = sinon.spy(global.window, 'removeEventListener');

    makeProportional = proportional();
  });
  after(() => {
    spyAdd.restore();
    spyRemove.restore();
  });

  it('adds and removes event listeners', () => {
    makeProportional({});
    expect(spyAdd.callCount).to.equal(1);
    expect(spyRemove.callCount).to.equal(0);

    makeProportional(null);
    expect(spyAdd.callCount).to.equal(1);
    expect(spyRemove.callCount).to.equal(1);
  });
});
