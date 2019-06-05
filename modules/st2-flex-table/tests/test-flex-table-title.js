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
import sinon from 'sinon';

import { FlexTableTitle } from '..';

function render(component) {
  return ReactTester.create(component).node;
}

describe(`${FlexTableTitle.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <FlexTableTitle
          className="foobar"
          onToggle={() => {}}
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <FlexTableTitle
          foo="bar"
          onToggle={() => {}}
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });

  it('renders an element', () => {
    const props = {
      icon: 'icon.png',
      onToggle: sinon.spy(),
    };

    const c = render(<FlexTableTitle {...props} title="some child node" />);

    expect(c.props.className).to.be.equal('st2-flex-table__caption st2-flex-table__caption--pack');

    c.props.onClick();
    expect(props.onToggle.calledOnce).to.be.true;

    const [ imgComponent, headingComponent ] = c.props.children;
    expect(imgComponent.props.src).to.be.equal(props.icon);

    expect(headingComponent.props.className).to.be.equal('st2-flex-table__caption-title');
    expect(headingComponent.props.children).to.be.equal('some child node');
  });

  it('renders an element without icon', () => {
    const props = {
      onToggle: sinon.spy(),
    };

    const c = render(<FlexTableTitle {...props} title="some child node" />);

    expect(c.props.className).to.be.equal('st2-flex-table__caption');

    c.props.onClick();
    expect(props.onToggle.calledOnce).to.be.true;

    const [ imgComponent, headingComponent ] = c.props.children;
    expect(imgComponent).to.be.null;

    expect(headingComponent.props.className).to.be.equal('st2-flex-table__caption-title');
    expect(headingComponent.props.children).to.be.equal('some child node');
  });
});
