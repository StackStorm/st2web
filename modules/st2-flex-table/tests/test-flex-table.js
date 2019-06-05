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

import { FlexTable } from '..';

function render(component) {
  return ReactTester.create(component).node;
}

describe(`${FlexTable.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <FlexTable
          className="foobar"
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <FlexTable
          foo="bar"
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });

  it('renders an element', () => {
    const props = {
      title: 'Some title',
      collapsed: false,
      icon: 'icon.png',
      onToggle: sinon.spy(),
    };

    const c = render(<FlexTable {...props}>some child node</FlexTable>);

    expect(c.props.className).to.be.equal('st2-flex-table');

    const [ titleComponent, ...restComponents ] = c.props.children;
    expect(titleComponent.props.icon).to.be.equal(props.icon);
    expect(titleComponent.props.title).to.be.equal(props.title);

    titleComponent.props.onToggle();
    expect(props.onToggle.calledOnce).to.be.true;

    expect(restComponents).to.have.length(1);
    expect(restComponents[0]).to.be.equal('some child node');
  });

  it('renders an element without icon', () => {
    const props = {
      title: 'Some title',
      collapsed: false,
      onToggle: sinon.spy(),
    };

    const c = render(<FlexTable {...props}>some child node</FlexTable>);

    expect(c.props.className).to.be.equal('st2-flex-table');

    const [ titleComponent, ...restComponents ] = c.props.children;
    expect(titleComponent.props.icon).to.be.undefined;
    expect(titleComponent.props.title).to.be.equal(props.title);

    titleComponent.props.onToggle();
    expect(props.onToggle.calledOnce).to.be.true;

    expect(restComponents).to.have.length(1);
    expect(restComponents[0]).to.be.equal('some child node');
  });

  it('renders an element without title', () => {
    const props = {
      collapsed: false,
      icon: 'icon.png',
      onToggle: sinon.spy(),
    };

    const c = render(<FlexTable {...props}>some child node</FlexTable>);

    expect(c.props.className).to.be.equal('st2-flex-table');

    const [ titleComponent, ...restComponents ] = c.props.children;
    expect(titleComponent).to.be.null;

    expect(restComponents).to.have.length(1);
    expect(restComponents[0]).to.be.equal('some child node');
  });

  it('renders an element collapsed', () => {
    const props = {
      title: 'Some title',
      collapsed: true,
      icon: 'icon.png',
      onToggle: sinon.spy(),
    };

    const c = render(<FlexTable {...props}>some child node</FlexTable>);

    expect(c.props.className).to.be.equal('st2-flex-table st2-flex-table--collapsed');

    const [ titleComponent, ...restComponents ] = c.props.children;
    expect(titleComponent.props.icon).to.be.equal(props.icon);
    expect(titleComponent.props.title).to.be.equal(props.title);

    titleComponent.props.onToggle();
    expect(props.onToggle.calledOnce).to.be.true;

    expect(restComponents).to.have.length(1);
    expect(restComponents[0]).to.be.null;
  });
});
