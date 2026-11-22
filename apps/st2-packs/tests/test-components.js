// Copyright 2026 The StackStorm Authors.
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

import { fireEvent } from '@testing-library/react';
import { renderNode } from '@stackstorm/module-test-utils';

import { ScrollIntoViewContext } from '@stackstorm/module-panel';

import PacksFlexCard from '../packs-flex-card.component';
import Table from '../table.component';

const version = (card) => card.querySelector('.st2-flex-card__header-version');

describe('PacksFlexCard', () => {
  const pack = { ref: 'aws', name: 'AWS', description: 'Amazon Web Services', version: '1.2.0' };

  it('shows the pack name, description and version', () => {
    const card = renderNode(<PacksFlexCard pack={pack} />);

    expect(card.getAttribute('data-test')).to.equal('pack pack:aws');
    expect(card.querySelector('.st2-flex-card__header-primary').textContent).to.equal('AWS');
    expect(card.querySelector('.st2-flex-card__header-secondary').textContent).to.equal('Amazon Web Services');
    expect(version(card).textContent).to.equal('1.2.0');
    expect(card.classList.contains('st2-flex-card--active')).to.be.false;
  });

  it('shows the installed version and flags it when it is behind', () => {
    const outdated = renderNode(<PacksFlexCard pack={{ ...pack, installedVersion: '1.0.0' }} />);
    expect(version(outdated).textContent).to.equal('1.0.0');
    expect(version(outdated).classList.contains('st2-flex-card__header-version--outdated')).to.be.true;

    const current = renderNode(<PacksFlexCard pack={{ ...pack, installedVersion: '1.2.0' }} />);
    expect(version(current).classList.contains('st2-flex-card__header-version--outdated')).to.be.false;
  });

  it('is highlighted, scrolled to when selected, and clickable', () => {
    const scrollIntoView = sinon.spy();
    const onClick = sinon.spy();

    const card = renderNode(
      <ScrollIntoViewContext value={{ scrollIntoView }}>
        <PacksFlexCard pack={pack} selected onClick={onClick} />
      </ScrollIntoViewContext>
    );

    expect(card.classList.contains('st2-flex-card--active')).to.be.true;
    expect(scrollIntoView.calledWith(card)).to.be.true;

    fireEvent.click(card);
    expect(onClick.calledOnce).to.be.true;
  });
});

describe('Table', () => {
  it('renders a label/value line per truthy entry and passes props through', () => {
    const table = renderNode(
      <Table
        data-test="pack_info"
        content={{ version: '1.0.0', author: 'StackStorm', email: undefined, keywords: '', link: <a href="#x">x</a> }}
      />
    );

    expect(table.getAttribute('data-test')).to.equal('pack_info');
    const lines = [ ...table.querySelectorAll('.st2-details__panel-body-line') ].map((line) => [
      line.querySelector('dt').textContent,
      line.querySelector('dd').textContent,
    ]);
    expect(lines).to.deep.equal([
      [ 'version', '1.0.0' ],
      [ 'author', 'StackStorm' ],
      [ 'link', 'x' ],
    ]);
    expect(table.querySelector('dd a').getAttribute('href')).to.equal('#x');
  });
});
