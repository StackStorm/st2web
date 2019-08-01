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

import filterExpandable from '..';

describe('filter-expandable', () => {
  it('works for "workflow"', () => {
    expect(filterExpandable({ action: { runner_type: 'workflow' } })).to.equal(true);
  });

  it('works for "action-chain"', () => {
    expect(filterExpandable({ action: { runner_type: 'action-chain' } })).to.equal(true);
  });

  it('works for "mistral-v1"', () => {
    expect(filterExpandable({ action: { runner_type: 'mistral-v1' } })).to.equal(true);
  });

  it('works for "mistral-v2"', () => {
    expect(filterExpandable({ action: { runner_type: 'mistral-v2' } })).to.equal(true);
  });

  it('works for "orquesta"', () => {
    expect(filterExpandable({ action: { runner_type: 'orquesta' } })).to.equal(true);
  });

  it('doesn\'t work for "foobar"', () => {
    expect(filterExpandable({ action: { runner_type: 'foobar' } })).to.equal(false);
  });
});
