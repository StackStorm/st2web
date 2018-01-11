import { expect } from 'chai';
import sinon from 'sinon';

import selectOnClick from '..';

describe('proportional', () => {
  it('adds event listeners', () => {
    const addEventListener = sinon.spy();
    selectOnClick({ addEventListener });
    expect(addEventListener.callCount).to.equal(1);
  });

  it('accepts null arguments', () => {
    selectOnClick(null);
  });
});
