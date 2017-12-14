import { expect } from 'chai';

const document = global.document = {
  _title: 'My App Title',
  get title() {
    return this._title;
  },
  set title(title) {
    this._title = title;
  },
};
const setTitle = require('..').default; // using `require` so that globals run first

describe('title', () => {
  it('accepts a string argument', () => {
    document.title = 'foobar';
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
