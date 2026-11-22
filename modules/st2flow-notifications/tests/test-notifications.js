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

import { describe, it, afterEach } from '@rstest/core';
import { expect } from 'chai';
import sinon from 'sinon';

import { render, screen, fireEvent, within } from '@testing-library/react';

import Notifications from '..';
import style from '../style.module.css';

const notifications = [
  { id: 1, type: 'error', message: 'Task "a" is missing an action' },
  { id: 2, type: 'warning', message: 'Unused input "b"' },
  { id: 3, type: 'info', message: 'Saved', link: 'https://example.com/#/history/5f0a' },
];

const renderNotifications = (props) => render(<Notifications notifications={notifications} {...props} />);
const bars = (container) => [ ...container.firstElementChild.children ];

describe('st2flow-notifications Notifications', () => {
  const originalOpen = window.open;

  afterEach(() => {
    window.open = originalOpen;
    sinon.restore();
  });

  it('renders one notification per entry, styled by its type', () => {
    const { container } = renderNotifications();

    const [ error, warning, info ] = bars(container);
    expect(bars(container)).to.have.length(3);
    expect(error.classList.contains(style.notification)).to.be.true;
    expect(error.classList.contains(style.error)).to.be.true;
    expect(error.textContent).to.contain('Task "a" is missing an action');
    expect(warning.classList.contains(style.warning)).to.be.true;
    expect(info.classList.contains(style.info)).to.be.true;
  });

  it('sits at the top unless given another position', () => {
    const top = renderNotifications({ className: 'foobar' }).container.firstElementChild;
    expect([ ...top.classList ]).to.have.members([ 'foobar', style.component, style.top ]);

    const bottom = renderNotifications({ position: 'bottom-right' }).container.firstElementChild;
    expect(bottom.classList.contains(style['bottom-right'])).to.be.true;
    expect(bottom.classList.contains(style.top)).to.be.false;
  });

  it('hides only the notification whose close button is used', () => {
    const { container } = renderNotifications();
    const [ error ] = bars(container);

    fireEvent.click(within(error).getByRole('button', { name: 'Close' }));

    expect(error.isConnected).to.be.false;
    expect(bars(container).map(bar => bar.textContent)).to.deep.equal([
      '×Unused input "b"',
      '×Savedhttps://example.com/#/history/5f0a',
    ]);
  });

  it('keeps the close click from reaching the surrounding UI', () => {
    const onClick = sinon.spy();
    const { container } = render(
      <div onClick={onClick}>
        <Notifications notifications={notifications} />
      </div>
    );

    fireEvent.click(within(container).getAllByRole('button', { name: 'Close' })[0]);

    expect(onClick.called).to.be.false;
  });

  it('opens links in the parent window instead of the editor frame', () => {
    const focus = sinon.spy();
    const open = sinon.stub().returns({ focus });
    // window.open is an accessor in this environment, which sinon.stub(window, 'open') can't replace
    window.open = open;
    renderNotifications();

    const link = screen.getByRole('link', { name: 'https://example.com/#/history/5f0a' });
    const event = fireEvent.click(link);

    expect(event).to.be.false; // default navigation was prevented
    expect(open.calledOnceWith('https://example.com/#/history/5f0a', 'parent')).to.be.true;
    expect(focus.calledOnce).to.be.true;
  });

  it('renders nothing extra for an empty list', () => {
    const { container } = render(<Notifications notifications={[]} />);

    expect(bars(container)).to.have.length(0);
  });
});
