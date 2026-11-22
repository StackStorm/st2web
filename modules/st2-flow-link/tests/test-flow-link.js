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

import { describe, it, beforeEach, afterEach } from '@rstest/core';
import { expect } from 'chai';
import sinon from 'sinon';

import { Provider } from 'react-redux';
import { legacy_createStore as createStore } from 'redux';
import { render, screen, fireEvent } from '@testing-library/react';

import router from '@stackstorm/module-router/methods';

import FlowLink from '../flow-link.component';
import style from '../style.module.css';

const renderLink = (props) => {
  const store = createStore(() => ({ location: { pathname: '/actions/core.local', search: '', hash: '' } }));

  return render(
    <Provider store={store}>
      <FlowLink {...props} />
    </Provider>
  );
};

describe('st2-flow-link FlowLink', () => {
  let push;
  let replace;

  beforeEach(() => {
    push = sinon.stub(router, 'push');
    replace = sinon.stub(router, 'replace');
    // React complains about the `replace` flag Link spreads onto its <a>; that's not under test here.
    sinon.stub(console, 'error');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('proxies className and extra props onto its wrapper', () => {
    const { container } = renderLink({ className: 'foobar', 'data-test': 'flow-link' });
    const wrapper = container.firstElementChild;

    expect(wrapper.classList.contains('foobar')).to.be.true;
    expect(wrapper.classList.contains(style.component)).to.be.true;
    expect(wrapper.getAttribute('data-test')).to.equal('flow-link');
  });

  it('links an action to its page in the workflow designer', () => {
    renderLink({ action: 'examples.orquesta-sequential' });

    const link = screen.getByRole('link', { name: 'Edit' });
    expect(link.getAttribute('href')).to.equal('#/action/examples.orquesta-sequential');
    expect(link.className).to.equal('st2-forms__button st2-details__toolbar-button');
  });

  it('navigates to the action in the designer when Edit is clicked', () => {
    renderLink({ action: 'examples.orquesta-sequential' });

    fireEvent.click(screen.getByRole('link', { name: 'Edit' }));

    expect(push.calledOnce).to.be.true;
    expect(push.firstCall.args[0]).to.deep.equal({ pathname: '/action/examples.orquesta-sequential', search: '', hash: '' });
    expect(replace.called).to.be.false;
  });

  it('offers a new-workflow link to the bare designer without an action', () => {
    const { container } = renderLink();

    const link = container.querySelector('a');
    expect(link.getAttribute('href')).to.equal('#/action');
    expect(link.className).to.equal('st2-panel__toolbar-button');
    expect(link.querySelector('i.icon-plus')).not.to.be.null;

    fireEvent.click(link);

    expect(replace.calledOnce).to.be.true;
    expect(replace.firstCall.args[0].pathname).to.equal('/action');
    expect(push.called).to.be.false;
  });
});
