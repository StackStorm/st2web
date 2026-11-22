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

import { fireEvent } from '@testing-library/react';
import { renderNode } from '@stackstorm/module-test-utils';
import sinon from 'sinon';

import { FlexTable } from '..';

const title = (node) => node.querySelector('.st2-flex-table__caption');

describe(`${FlexTable.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = renderNode(
        <FlexTable
          className="foobar"
        />
      );

      expect(instance.classList.contains('foobar')).to.be.true;
    });

    it('proxies extra props', () => {
      const instance = renderNode(
        <FlexTable
          foo="bar"
        />
      );

      expect(instance.getAttribute('foo')).to.equal('bar');
    });
  });

  it('renders an element', () => {
    const props = {
      title: 'Some title',
      collapsed: false,
      icon: 'icon.png',
      onToggle: sinon.spy(),
    };

    const node = renderNode(<FlexTable {...props}>some child node</FlexTable>);

    expect(node.className).to.be.equal('st2-flex-table');

    expect(title(node).querySelector('img').getAttribute('src')).to.be.equal(props.icon);
    expect(title(node).textContent).to.be.equal(props.title);

    fireEvent.click(title(node));
    expect(props.onToggle.calledOnce).to.be.true;

    expect(node.childNodes).to.have.length(2);
    expect(node.lastChild.textContent).to.be.equal('some child node');
  });

  it('renders an element without icon', () => {
    const props = {
      title: 'Some title',
      collapsed: false,
      onToggle: sinon.spy(),
    };

    const node = renderNode(<FlexTable {...props}>some child node</FlexTable>);

    expect(node.className).to.be.equal('st2-flex-table');

    expect(title(node).querySelector('img')).to.be.null;
    expect(title(node).textContent).to.be.equal(props.title);

    fireEvent.click(title(node));
    expect(props.onToggle.calledOnce).to.be.true;

    expect(node.childNodes).to.have.length(2);
    expect(node.lastChild.textContent).to.be.equal('some child node');
  });

  it('renders an element without title', () => {
    const props = {
      collapsed: false,
      icon: 'icon.png',
      onToggle: sinon.spy(),
    };

    const node = renderNode(<FlexTable {...props}>some child node</FlexTable>);

    expect(node.className).to.be.equal('st2-flex-table');
    expect(title(node)).to.be.null;
    expect(node.textContent).to.be.equal('some child node');
  });

  it('renders an element collapsed', () => {
    const props = {
      title: 'Some title',
      collapsed: true,
      icon: 'icon.png',
      onToggle: sinon.spy(),
    };

    const node = renderNode(<FlexTable {...props}>some child node</FlexTable>);

    expect(node.className).to.be.equal('st2-flex-table st2-flex-table--collapsed');

    expect(title(node).querySelector('img').getAttribute('src')).to.be.equal(props.icon);
    expect(title(node).textContent).to.be.equal(props.title);

    fireEvent.click(title(node));
    expect(props.onToggle.calledOnce).to.be.true;

    // collapsed: only the title, not the children
    expect(node.childNodes).to.have.length(1);
  });
});
