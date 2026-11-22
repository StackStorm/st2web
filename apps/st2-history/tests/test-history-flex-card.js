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

import { render, fireEvent } from '@testing-library/react';

import HistoryFlexCard from '../history-flex-card.component';

const VIEW = {
  meta: { status: true, type: true, time: true },
  action: { params: true },
  trigger: true,
};

const manual = {
  id: 'e1',
  status: 'succeeded',
  start_timestamp: '2026-10-30T12:34:56.000Z',
  action: { ref: 'core.local', runner_type: 'local-shell-cmd' },
  parameters: { cmd: 'date', timeout: 60 },
  context: { user: 'st2admin' },
};

const workflow = {
  id: 'w1',
  status: 'running',
  start_timestamp: '2026-10-30T12:00:00.000Z',
  action: { ref: 'examples.orquesta-sequential', runner_type: 'orquesta' },
  parameters: {},
  rule: { ref: 'examples.webhook_rule' },
  trigger: { type: 'core.st2.webhook' },
  context: { user: 'stanley' },
};

const child = {
  id: 'w1-1',
  status: 'succeeded',
  start_timestamp: '2026-10-30T12:00:01.000Z',
  action: { ref: 'core.echo', runner_type: 'local-shell-cmd' },
  parameters: { message: 'hi' },
  context: { user: 'stanley', orquesta: { task_name: 'task1' }},
};

function renderCard(props) {
  const handlers = { onSelect: sinon.spy(), onToggleExpand: sinon.spy(), handleToggleUTC: sinon.spy() };
  const { container } = render(
    <HistoryFlexCard
      execution={manual}
      childExecutions={{}}
      view={VIEW}
      displayUTC
      {...handlers}
      {...props}
    />
  );

  return { container, card: container.firstElementChild, ...handlers };
}

describe(`${HistoryFlexCard.name} Component`, () => {
  it('shows status, start time, action and parameters', () => {
    const { card } = renderCard();

    expect(card.getAttribute('data-test')).to.equal('execution execution:e1');
    expect(card.querySelector('.st2-flex-card__status').textContent).to.equal('Succeeded');
    expect(card.querySelector('.st2-flex-card__timestamp').textContent).to.equal('12:34:56 UTC');
    expect(card.querySelector('.st2-history__column-action-name').textContent).to.equal('core.local');
    const params = [ ...card.querySelectorAll('.st2-history__column-action-param') ].map(p => p.textContent);
    expect(params).to.deep.equal([ 'cmd="date"', 'timeout=60' ]);
  });

  it('names the user of a manual run, and the rule and trigger of a triggered one', () => {
    const { card: manualCard } = renderCard();
    expect(manualCard.querySelector('[title="Manual (st2admin)"]').textContent).to.equal('Manualst2admin');

    const { card: ruleCard } = renderCard({ execution: workflow });
    expect(ruleCard.querySelector('.st2-history__column-rule-name').textContent).to.equal('examples.webhook_rule');
    expect(ruleCard.querySelector('.st2-history__column-trigger-type').textContent).to.equal('core.st2.webhook');
  });

  it('leaves out what the view hides', () => {
    const { card } = renderCard({ view: { meta: { status: false, time: false }, action: false, trigger: false }});

    expect(card.querySelector('.st2-flex-card__status').textContent).to.equal('');
    expect(card.querySelector('.st2-flex-card__timestamp').textContent).to.equal('');
    expect(card.querySelector('.st2-history__column-action-name')).to.be.null;
    expect(card.textContent).to.not.include('st2admin');
  });

  it('renders nothing until the view is known', () => {
    const { container } = renderCard({ view: {}});

    expect(container.children).to.have.length(0);
  });

  it('marks the selected execution and selects on click', () => {
    const { card, onSelect } = renderCard({ selected: 'e1' });

    expect(card.classList.contains('st2-flex-card--active')).to.be.true;

    fireEvent.click(card);
    expect(onSelect.calledOnceWith('e1')).to.be.true;
  });

  it('offers expansion only for workflows', () => {
    const { card: manualCard } = renderCard();
    expect(manualCard.querySelector('.icon-chevron_right')).to.be.null;

    const { card, onToggleExpand, onSelect } = renderCard({ execution: workflow });
    fireEvent.click(card.querySelector('.icon-chevron_right'));
    fireEvent.click(card.querySelector('.icon-branch'));

    expect(onToggleExpand.args).to.deep.equal([[ 'w1', true ], [ 'w1', true ]]);
    expect(onSelect.called).to.be.false;
  });

  it('shows the children of an expanded workflow, with their task names', () => {
    const { container, card, onToggleExpand, onSelect } = renderCard({ execution: workflow, childExecutions: { w1: [ child ]}});

    expect(card.classList.contains('st2-flex-card--expanded')).to.be.true;
    fireEvent.click(card.querySelector('.icon-chevron-down'));
    expect(onToggleExpand.calledOnceWith('w1', false)).to.be.true;

    const childCard = container.querySelector('.st2-history-child [data-test="execution execution:w1-1"]');
    expect(childCard.textContent).to.include('task1');
    expect(childCard.textContent).to.include('core.echo');
    // children don't repeat the trigger column
    expect(childCard.textContent).to.not.include('Manual');

    fireEvent.click(childCard);
    expect(onSelect.calledOnceWith('w1-1')).to.be.true;
  });

  it('toggles UTC display from the time', () => {
    const { card, handleToggleUTC } = renderCard();

    fireEvent.click(card.querySelector('time'));

    expect(handleToggleUTC.calledOnce).to.be.true;
  });
});
