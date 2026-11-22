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

import HistoryPopup from '../history-popup.component';

const SPEC = {
  type: 'object',
  properties: {
    cmd: { type: 'string', required: true },
    password: { type: 'string', secret: true },
    timeout: { type: 'integer', default: 60 },
  },
};

function renderPopup(props) {
  const onSubmit = sinon.spy();
  const onCancel = sinon.spy();
  const { container } = render(
    <HistoryPopup
      action="core.remote"
      spec={SPEC}
      payload={{ cmd: 'uptime', password: '********' }}
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...props}
    />
  );

  const field = (name) => container.querySelector(`[data-test="field:${name}"]`);
  const button = (name) => container.querySelector(`[data-test="rerun_${name}"]`);

  return { container, field, button, onSubmit, onCancel };
}

describe(`${HistoryPopup.name} Component`, () => {
  it('shows the action and the previous input', () => {
    const { container, field } = renderPopup();

    expect(container.querySelector('[data-test="rerun_popup"]').textContent).to.include('Rerun an execution');
    expect(container.querySelector('[data-test="rerun_form_action"]').value).to.equal('core.remote');
    expect(field('cmd').value).to.equal('uptime');
    expect(field('timeout').value).to.equal('');
    expect(field('timeout').placeholder).to.equal('60');
    expect(document.title).to.equal('Rerun - core.remote - History | My App Title');
  });

  it('submits the edited input once', () => {
    const { field, button, onSubmit } = renderPopup();

    fireEvent.change(field('cmd'), { target: { value: 'hostname' }});
    fireEvent.change(field('password'), { target: { value: 'hunter2' }});
    fireEvent.click(button('submit'));

    expect(onSubmit.calledOnce).to.be.true;
    expect(onSubmit.firstCall.args[0]).to.deep.equal({ cmd: 'hostname', password: 'hunter2' });
    expect(button('submit').disabled).to.be.true;
  });

  it('leaves out a secret that was not re-entered, so the API reuses the stored one', () => {
    const { field, button, onSubmit } = renderPopup();

    fireEvent.change(field('cmd'), { target: { value: 'hostname' }});
    fireEvent.click(button('submit'));

    expect(onSubmit.firstCall.args[0]).to.deep.equal({ cmd: 'hostname' });
  });

  it('previews the input that will be sent', () => {
    const { container, field, button } = renderPopup();

    fireEvent.change(field('cmd'), { target: { value: 'hostname' }});
    fireEvent.click(button('preview'));
    expect(container.textContent).to.include('"cmd": "hostname"');

    fireEvent.click(button('preview'));
    expect(container.textContent).to.not.include('"cmd": "hostname"');
  });

  it('cancels from the button, the backdrop or Escape', () => {
    const { container, button, onCancel } = renderPopup();

    fireEvent.click(button('cancel'));
    fireEvent.click(container.querySelector('[data-test="rerun_popup"]'));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCancel.callCount).to.equal(3);
  });
});
