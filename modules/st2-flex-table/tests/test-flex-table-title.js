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

import { FlexTableTitle } from '..';

describe(`${FlexTableTitle.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = renderNode(
        <FlexTableTitle
          className="foobar"
          onToggle={() => {}}
        />
      );

      expect(instance.classList.contains('foobar')).to.be.true;
    });

    it('proxies extra props', () => {
      const instance = renderNode(
        <FlexTableTitle
          foo="bar"
          onToggle={() => {}}
        />
      );

      expect(instance.getAttribute('foo')).to.equal('bar');
    });
  });

  it('renders an element', () => {
    const props = {
      icon: 'icon.png',
      onToggle: sinon.spy(),
    };

    const node = renderNode(<FlexTableTitle {...props} title="some child node" />);

    expect(node.className).to.be.equal('st2-flex-table__caption st2-flex-table__caption--pack');

    fireEvent.click(node);
    expect(props.onToggle.calledOnce).to.be.true;

    const [ img, heading ] = node.children;
    expect(img.tagName).to.be.equal('IMG');
    expect(img.getAttribute('src')).to.be.equal(props.icon);

    expect(heading.className).to.be.equal('st2-flex-table__caption-title');
    expect(heading.textContent).to.be.equal('some child node');
  });

  it('renders an element without icon', () => {
    const props = {
      onToggle: sinon.spy(),
    };

    const node = renderNode(<FlexTableTitle {...props} title="some child node" />);

    expect(node.className).to.be.equal('st2-flex-table__caption');

    fireEvent.click(node);
    expect(props.onToggle.calledOnce).to.be.true;

    expect(node.querySelector('img')).to.be.null;
    expect(node.children).to.have.length(1);

    const [ heading ] = node.children;
    expect(heading.className).to.be.equal('st2-flex-table__caption-title');
    expect(heading.textContent).to.be.equal('some child node');
  });
});
