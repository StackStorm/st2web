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


import { describe, it, beforeEach } from '@rstest/core';
import { expect } from 'chai';
import sinon from 'sinon';

import { parsePath, createPath, createLocation, createHashHistory } from '../history';

describe('st2-router history', () => {
  describe('parsePath', () => {
    it('splits pathname, search and hash', () => {
      expect(parsePath('/history/1/general?action=core.local#top')).to.deep.equal({
        pathname: '/history/1/general',
        search: '?action=core.local',
        hash: '#top',
      });
    });

    it('defaults to the root and drops empty separators', () => {
      expect(parsePath('')).to.deep.equal({ pathname: '/', search: '', hash: '' });
      expect(parsePath('/actions?#')).to.deep.equal({ pathname: '/actions', search: '', hash: '' });
    });
  });

  describe('createPath', () => {
    it('joins a location back into a path', () => {
      expect(createPath({ pathname: '/rules', search: '?pack=core', hash: '' })).to.equal('/rules?pack=core');
      expect(createPath({ pathname: '/rules', search: 'pack=core', hash: 'x' })).to.equal('/rules?pack=core#x');
    });
  });

  describe('createLocation', () => {
    const current = { pathname: '/actions/core.local/general', search: '', hash: '' };

    it('keeps absolute paths', () => {
      expect(createLocation('/history?x=1', current)).to.deep.equal({ pathname: '/history', search: '?x=1', hash: '' });
    });

    it('resolves relative paths against the current location', () => {
      expect(createLocation('code', current).pathname).to.equal('/actions/core.local/code');
      expect(createLocation('../core.remote', current).pathname).to.equal('/actions/core.remote');
    });

    it('fills in the current pathname for a search-only target', () => {
      expect(createLocation({ search: '?x=1' }, current)).to.deep.equal({ pathname: current.pathname, search: '?x=1', hash: '' });
    });
  });

  describe('createHashHistory', () => {
    beforeEach(() => {
      window.history.replaceState(null, '', '/#/history');
    });

    it('reads the current location from the hash', () => {
      const history = createHashHistory(window);

      expect(history.location).to.deep.equal({ pathname: '/history', search: '', hash: '' });
    });

    it('pushes a new hash and notifies listeners', () => {
      const history = createHashHistory(window);
      const listener = sinon.spy();
      history.listen(listener);
      const length = window.history.length;

      history.push({ pathname: '/actions', search: '?pack=core' });

      expect(window.location.hash).to.equal('#/actions?pack=core');
      expect(window.history.length).to.equal(length + 1);
      expect(listener).to.have.property('calledOnce', true);
      expect(listener.firstCall.args).to.deep.equal([{ pathname: '/actions', search: '?pack=core', hash: '' }, 'PUSH' ]);
    });

    it('replaces without adding a history entry, and re-announces the current location with no target', () => {
      const history = createHashHistory(window);
      const listener = sinon.spy();
      history.listen(listener);
      const length = window.history.length;

      history.replace('/rules');
      history.replace();

      expect(window.location.hash).to.equal('#/rules');
      expect(window.history.length).to.equal(length);
      expect(listener.args.map(([ location, action ]) => [ location.pathname, action ])).to.deep.equal([
        [ '/rules', 'REPLACE' ],
        [ '/rules', 'REPLACE' ],
      ]);
    });

    it('reports hash changes made outside the router as POP', () => {
      const history = createHashHistory(window);
      const listener = sinon.spy();
      history.listen(listener);

      window.history.replaceState(null, '', '/#/packs');
      window.dispatchEvent(new window.HashChangeEvent('hashchange'));

      expect(listener.firstCall.args).to.deep.equal([{ pathname: '/packs', search: '', hash: '' }, 'POP' ]);
    });

    it('decodes the pathname the browser keeps encoded, as on a reload or bookmark', () => {
      // a rule ref with a space: pushes keep it decoded, but location.hash reads back %20
      window.history.replaceState(null, '', '/#/rules/core.my%20rule/general?q=a%20b');
      const history = createHashHistory(window);

      expect(history.location).to.deep.equal({ pathname: '/rules/core.my rule/general', search: '?q=a%20b', hash: '' });
    });

    it('decodes on Back and forward too, and leaves a malformed escape as it is', () => {
      const history = createHashHistory(window);
      const listener = sinon.spy();
      history.listen(listener);

      window.history.replaceState(null, '', '/#/rules/core.my%20rule');
      window.dispatchEvent(new window.PopStateEvent('popstate'));
      window.history.replaceState(null, '', '/#/rules/100%');
      window.dispatchEvent(new window.PopStateEvent('popstate'));

      expect(listener.args.map(([ location, action ]) => [ location.pathname, action ])).to.deep.equal([
        [ '/rules/core.my rule', 'POP' ],
        [ '/rules/100%', 'POP' ],
      ]);
    });

    it('does not announce a push of a decoded path as a change when the browser re-encodes it', () => {
      const history = createHashHistory(window);
      history.push('/rules/core.my rule');
      const listener = sinon.spy();
      history.listen(listener);

      window.dispatchEvent(new window.HashChangeEvent('hashchange'));

      expect(listener).to.have.property('called', false);
    });

    it('stops notifying after unlisten', () => {
      const history = createHashHistory(window);
      const listener = sinon.spy();
      const unlisten = history.listen(listener);

      unlisten();
      history.push('/triggers');

      expect(listener).to.have.property('called', false);
    });
  });
});
