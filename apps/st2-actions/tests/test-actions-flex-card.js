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

import ActionsFlexCard from '../actions-flex-card.component';

const ACTION = {
  ref: 'core.local',
  name: 'local',
  description: 'Run a command',
  runner_type: 'local-shell-cmd',
};

const ALL = { type: true, action: true, runner: true, description: true };

describe(`${ActionsFlexCard.name} Component`, () => {
  it('shows the action fields the view asks for', () => {
    const card = renderNode(<ActionsFlexCard action={ACTION} view={ALL} />);

    expect(card.dataset.test).to.equal('action action:core.local');
    expect(card.querySelector('.st2-flex-card__header-primary').textContent).to.equal('local');
    expect(card.querySelector('.st2-flex-card__header-primary').title).to.equal('core.local');
    expect(card.querySelector('.st2-flex-card__header-secondary').textContent).to.equal('Run a command');
    expect(card.querySelector('.st2-flex-card__header-type').textContent).to.equal('local-shell-cmd');
    expect(card.classList.contains('st2-flex-card--active')).to.be.false;

    const bare = renderNode(<ActionsFlexCard action={ACTION} view={{ action: true }} />);
    expect(bare.querySelector('.st2-flex-card__header-primary')).to.exist;
    expect(bare.querySelector('.st2-flex-card__header-secondary')).to.be.null;
    expect(bare.querySelector('.st2-flex-card__header-type')).to.be.null;
    expect(bare.querySelector('.st2-flex-card__header-status')).to.be.null;
  });

  it('marks workflows, which can be expanded in history', () => {
    const plain = renderNode(<ActionsFlexCard action={ACTION} view={ALL} />);
    const workflow = renderNode(<ActionsFlexCard action={{ ...ACTION, runner_type: 'orquesta' }} view={ALL} />);

    expect(plain.querySelector('.icon-branch')).to.be.null;
    expect(workflow.querySelector('.st2-flex-card__header-status .icon-branch')).to.exist;
  });

  it('is highlighted and scrolled to when selected', () => {
    const scrollIntoView = sinon.spy();
    const onClick = sinon.spy();

    const card = renderNode(
      <ScrollIntoViewContext value={{ scrollIntoView }}>
        <ActionsFlexCard action={ACTION} view={ALL} selected onClick={onClick} />
      </ScrollIntoViewContext>
    );

    expect(card.classList.contains('st2-flex-card--active')).to.be.true;
    expect(scrollIntoView.calledWith(card)).to.be.true;

    fireEvent.click(card);
    expect(onClick.calledOnce).to.be.true;
  });
});
