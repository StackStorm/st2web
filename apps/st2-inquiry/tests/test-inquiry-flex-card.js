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

import flexStyle from '@stackstorm/module-flex-table/style.module.css';

import InquiryFlexCard from '../inquiry-flex-card.component';

describe(`${InquiryFlexCard.name} Component`, () => {
  const inquiry = { id: '5f0a', status: 'pending' };

  it('shows the inquiry id', () => {
    const card = renderNode(<InquiryFlexCard inquiry={inquiry} onSelect={() => {}} />);

    expect(card.getAttribute('data-test')).to.equal('inquiry inquiry:5f0a');
    expect(card.textContent).to.equal('5f0a');
    expect(card.querySelector('[title="5f0a"]')).to.not.be.null;
  });

  it('is highlighted only when selected', () => {
    const selected = renderNode(<InquiryFlexCard inquiry={inquiry} selected="5f0a" onSelect={() => {}} />);
    const other = renderNode(<InquiryFlexCard inquiry={inquiry} selected="1234" onSelect={() => {}} />);

    expect(selected.classList.contains(flexStyle.active)).to.be.true;
    expect(other.classList.contains(flexStyle.active)).to.be.false;
  });

  it('selects the inquiry on click', () => {
    const onSelect = sinon.spy();
    const card = renderNode(<InquiryFlexCard inquiry={inquiry} onSelect={onSelect} />);

    fireEvent.click(card);

    expect(onSelect.calledOnceWith('5f0a')).to.be.true;
  });
});
