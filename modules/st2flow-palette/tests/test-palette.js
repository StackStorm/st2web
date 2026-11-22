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

import api from '@stackstorm/module-api';

import Palette from '..';
import style from '../style.module.css';

const actions = [
  { ref: 'core.local', pack: 'core', runner_type: 'local-shell-cmd', description: 'Run a local command' },
  { ref: 'core.http', pack: 'core', runner_type: 'http-request', description: 'Make an HTTP request' },
  { ref: 'examples.orquesta-basic', pack: 'examples', runner_type: 'orquesta', description: 'A basic workflow' },
];

const renderPalette = (props) => {
  // the palette takes its actions from the workflow store, not from props
  const store = createStore(() => ({ flow: { actions }}));

  return render(
    <Provider store={store}>
      <Palette {...props} />
    </Provider>
  );
};

const packNames = () => screen.queryAllByRole('heading').map(heading => heading.textContent.trim());
const actionRefs = (container) => [ ...container.querySelectorAll(`.${style.action}`) ].map(el => el.firstChild.textContent);
const openPack = (name) => fireEvent.click(screen.getByRole('heading', { name }));
const search = (value) => fireEvent.change(screen.getByPlaceholderText('Library'), { target: { value }});

describe('st2flow-palette Palette', () => {
  let server;

  beforeEach(() => {
    server = api.server;
    // pack icons are URLs under the API; nothing loads them in jsdom
    api.server = { api: 'https://example.com/api' };
  });

  afterEach(() => {
    api.server = server;
    sinon.restore();
  });

  it('proxies className', () => {
    const { container } = renderPalette({ className: 'foobar' });

    expect(container.firstElementChild.classList.contains('foobar')).to.be.true;
    expect(container.firstElementChild.classList.contains(style.component)).to.be.true;
  });

  it('groups actions by pack, collapsed, with the pack icon', () => {
    const { container } = renderPalette();

    expect(packNames()).to.deep.equal([ 'core', 'examples' ]);
    expect(actionRefs(container)).to.deep.equal([]);
    expect([ ...container.querySelectorAll('img') ].map(img => img.getAttribute('src'))).to.deep.equal([
      'https://example.com/api/v1/packs/views/file/core/icon.png',
      'https://example.com/api/v1/packs/views/file/examples/icon.png',
    ]);
  });

  it('falls back to the default icon when a pack icon fails to load', () => {
    const { container } = renderPalette();
    const img = container.querySelector('img');

    fireEvent.error(img);

    expect(img.getAttribute('src')).to.equal('img/icon.png');
  });

  it('expands and collapses a pack when its header is clicked', () => {
    const { container } = renderPalette();

    openPack('core');
    expect(actionRefs(container)).to.deep.equal([ 'core.local', 'core.http' ]);
    expect(container.querySelector('.icon-chevron_down')).not.to.be.null;
    expect(screen.getByText('Run a local command')).not.to.be.null;

    openPack('core');
    expect(actionRefs(container)).to.deep.equal([]);
    expect(container.querySelector('.icon-chevron_down')).to.be.null;
  });

  it('narrows the list to actions whose ref matches the search, ignoring case', () => {
    const { container } = renderPalette();

    search('HTTP');
    expect(packNames()).to.deep.equal([ 'core' ]);
    openPack('core');
    expect(actionRefs(container)).to.deep.equal([ 'core.http' ]);

    search('nothing-matches');
    expect(packNames()).to.deep.equal([]);

    search('');
    expect(packNames()).to.deep.equal([ 'core', 'examples' ]);
  });

  it('keeps a pack open while the search changes', () => {
    const { container } = renderPalette();

    openPack('core');
    search('local');

    expect(actionRefs(container)).to.deep.equal([ 'core.local' ]);
  });

  it('makes every action draggable', () => {
    const { container } = renderPalette();
    openPack('core');
    openPack('examples');

    const draggable = [ ...container.querySelectorAll(`.${style.action}`) ];
    expect(draggable).to.have.length(3);
    draggable.forEach(el => expect(el.getAttribute('draggable')).to.equal('true'));
  });

  it('carries the action and the grab offset as drag data for the canvas', () => {
    const { container } = renderPalette();
    openPack('examples');

    const setData = sinon.spy();
    const dataTransfer = { setData, effectAllowed: 'all' };
    const event = new window.MouseEvent('dragstart', { bubbles: true });
    Object.defineProperties(event, {
      dataTransfer: { value: dataTransfer },
      offsetX: { value: 12 },
      offsetY: { value: 5 },
    });

    container.querySelector(`.${style.action}`).dispatchEvent(event);

    expect(dataTransfer.effectAllowed).to.equal('copy');
    expect(setData.calledOnce).to.be.true;
    const [ type, data ] = setData.firstCall.args;
    expect(type).to.equal('application/json');
    expect(JSON.parse(data)).to.deep.equal({
      action: actions[2],
      handle: { x: 12, y: 5 },
    });
  });
});
