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


import { describe, it } from '@rstest/core';
import { expect } from 'chai';

import { Provider } from 'react-redux';
import { legacy_createStore as createStore } from 'redux';
import { render } from '@testing-library/react';

import Route from '../route.component';

// Renders the route at `pathname` and returns the match it passed to `render`, or null.
function matchAt(path, pathname) {
  const store = createStore(() => ({ location: { pathname, search: '', hash: '' } }));
  let match = null;

  render(
    <Provider store={store}>
      <Route
        path={path}
        render={(props) => {
          match = props.match;
          return <span>matched</span>;
        }}
      />
    </Provider>
  );

  return match;
}

describe('st2-router Route', () => {
  const path = '/actions/:ref?/:section?';

  it('matches the bare app path with no params', () => {
    expect(matchAt(path, '/actions').params).to.deep.equal({ ref: undefined, section: undefined });
  });

  it('fills optional params, including refs with dots', () => {
    expect(matchAt(path, '/actions/core.local').params).to.deep.equal({ ref: 'core.local', section: undefined });
    expect(matchAt(path, '/actions/core.local/general').params).to.deep.equal({ ref: 'core.local', section: 'general' });
  });

  it('matches by prefix, like react-router 5 did', () => {
    expect(matchAt(path, '/actions/core.local/general/extra').params.section).to.equal('general');
  });

  it('renders nothing for other apps', () => {
    expect(matchAt(path, '/history/1')).to.equal(null);
    expect(matchAt(path, '/actionsx')).to.equal(null);
  });
});
