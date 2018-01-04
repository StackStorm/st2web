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
