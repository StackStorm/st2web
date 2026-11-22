// Copyright 2021 The StackStorm Authors.
// Copyright 2020 Extreme Networks, Inc.
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
import sinon from 'sinon';

import { render, fireEvent } from '@testing-library/react';

import TransitionGroup from '../transition';

const task = (name) => ({ name, coords: { x: 0, y: 0 }, size: { x: 100, y: 50 } });

const renderGroup = (props) => render(
  <svg>
    <TransitionGroup
      color="red"
      transitions={[{ from: { task: task('a'), anchor: 'bottom' }, to: { task: task('b'), anchor: 'top' } }]}
      taskRefs={{}}
      selected={false}
      {...props}
    />
  </svg>
);

describe('st2flow-canvas TransitionGroup', () => {
  it('draws a border, an active and a base path per transition', () => {
    const { container } = renderGroup();

    expect(container.querySelectorAll('svg > path')).to.have.length(3);
  });

  it('calls onClick exactly once when a transition path is clicked', () => {
    const onClick = sinon.spy();
    const { container } = renderGroup({ onClick });

    fireEvent.click(container.querySelector('svg > path'));

    expect(onClick.calledOnce).to.be.true;
    expect(onClick.firstCall.args[0].type).to.equal('click');
  });
});
