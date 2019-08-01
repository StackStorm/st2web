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

import { expect } from 'chai';

import '@stackstorm/module-test-utils/bootstrap/title';
import setTitle from '..';

describe('title', () => {
  it('accepts a string argument', () => {
    document.title = 'dummy';
    setTitle('Foobar');
    expect(document.title).to.equal('Foobar | My App Title');
  });

  it('accepts an array argument', () => {
    document.title = 'dummy';
    setTitle([ 'Foobar' ]);
    expect(document.title).to.equal('Foobar | My App Title');

    document.title = 'dummy';
    setTitle([ 'Foo', 'Bar' ]);
    expect(document.title).to.equal('Foo - Bar | My App Title');
  });

  it('filters the array argument', () => {
    document.title = 'dummy';
    setTitle([ 'Foo', null, 'Bar' ]);
    expect(document.title).to.equal('Foo - Bar | My App Title');
  });

  it('accepts an empty argument', () => {
    document.title = 'dummy';
    setTitle();
    expect(document.title).to.equal('My App Title');

    document.title = 'dummy';
    setTitle(null);
    expect(document.title).to.equal('My App Title');

    document.title = 'dummy';
    setTitle('');
    expect(document.title).to.equal('My App Title');

    document.title = 'dummy';
    setTitle([]);
    expect(document.title).to.equal('My App Title');
  });
});
