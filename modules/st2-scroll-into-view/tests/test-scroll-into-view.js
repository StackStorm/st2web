import { expect } from 'chai';

import scrollIntoView from '..';

describe('proportional', () => {
  it('accepts null arguments', () => {
    scrollIntoView(null, null);
    scrollIntoView(null, {});
    scrollIntoView({}, null);
  });

  describe('scrolling up', () => {
    it('sets the container scrollTop properly', () => {
      scrollIntoView({
        get scrollTop() {
          return 100;
        },
        set scrollTop(value) {
          expect(value).to.equal(150);
        },
        getBoundingClientRect: () => ({ top: 100, height: 100 }),
      }, {
        getBoundingClientRect: () => ({ top: 200, height: 50 }),
      });
    });
  });

  describe('scrolling down', () => {
    it('sets the container scrollTop properly', () => {
      scrollIntoView({
        get scrollTop() {
          return 100;
        },
        set scrollTop(value) {
          expect(value).to.equal(0);
        },
        getBoundingClientRect: () => ({ top: 200, height: 100 }),
      }, {
        getBoundingClientRect: () => ({ top: 100, height: 50 }),
      });
    });
  });

  describe('not scrolling', () => {
    it('sets the container scrollTop properly', () => {
      scrollIntoView({
        get scrollTop() {
          return 100;
        },
        set scrollTop(value) {
          throw new Error('scrollTop should not be called.');
        },
        getBoundingClientRect: () => ({ top: 100, height: 100 }),
      }, {
        getBoundingClientRect: () => ({ top: 125, height: 50 }),
      });
    });
  });
});
