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

import { describe, it, beforeEach, afterEach } from '@rstest/core';
import { expect } from 'chai';
import sinon from 'sinon';

import router from '@stackstorm/module-router/methods';

import notification from '..';

const toasts = () => [ ...document.querySelectorAll('.st2-notification__bar') ];

describe('notification', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    sinon.stub(console, 'log');
  });

  afterEach(() => {
    clock.runAll();
    clock.restore();
    sinon.restore();
  });

  it('shows a toast of the given type', () => {
    notification.success('Action "core.local" has been scheduled successfully.');

    const [ toast ] = toasts();
    expect(toast.classList.contains('st2-notification__bar--success')).to.be.true;
    expect(toast.textContent).to.equal('Action "core.local" has been scheduled successfully.');
    expect(toast.closest('.st2-notification').parentNode).to.equal(document.body);
  });

  it('renders text as text, not HTML', () => {
    notification.error('<img src=x onerror=alert(1)>');

    const [ toast ] = toasts();
    expect(toast.querySelector('img')).to.be.null;
    expect(toast.textContent).to.equal('<img src=x onerror=alert(1)>');
  });

  it('closes after nine seconds, but not while hovered', () => {
    notification.info('hello');
    const [ toast ] = toasts();

    clock.tick(5000);
    toast.dispatchEvent(new window.MouseEvent('mouseenter'));
    clock.tick(10000);
    expect(toast.isConnected).to.be.true;

    toast.dispatchEvent(new window.MouseEvent('mouseleave'));
    clock.tick(3999);
    expect(toast.classList.contains('st2-notification__bar--closing')).to.be.false;
    clock.tick(1);
    expect(toast.classList.contains('st2-notification__bar--closing')).to.be.true;
    clock.tick(600);
    expect(toast.isConnected).to.be.false;
  });

  it('closes on click', () => {
    notification.warning('hello');
    const [ toast ] = toasts();

    toast.click();
    clock.tick(600);

    expect(toast.isConnected).to.be.false;
  });

  it('adds API error messages, or points at the console for other errors', () => {
    notification.error('Unable to schedule action.', { err: { name: 'APIError', message: 'Bad request' }});
    notification.error('Unable to load.', { err: new Error('boom') });

    const [ apiError, otherError ] = toasts();
    expect(apiError.textContent).to.equal('Unable to schedule action. Bad request');
    expect(otherError.textContent).to.equal('Unable to load. See details in developer tools console.');
  });

  it('links to the execution and closes when the button is used', () => {
    const push = sinon.stub(router, 'push');
    notification.success('Scheduled.', { execution_id: '5f0a' });

    const [ toast ] = toasts();
    const button = toast.querySelector('button');
    expect(button.textContent).to.equal('Show execution');
    expect(button.className).to.equal('st2-forms__button st2-forms__button--skeleton');

    button.click();
    clock.tick(600);

    expect(push.calledOnceWith({ pathname: '/history/5f0a' })).to.be.true;
    expect(toast.isConnected).to.be.false;
  });

  it('passes extra button attributes through', () => {
    const onClick = sinon.spy();
    notification.info('Saved.', { buttons: [{ text: 'Undo', className: 'undo', onClick, 'data-test': 'undo' }] });

    const button = toasts()[0].querySelector('button');
    expect(button.getAttribute('data-test')).to.equal('undo');
    expect(button.classList.contains('undo')).to.be.true;

    button.click();
    expect(onClick.calledOnce).to.be.true;
  });
});
