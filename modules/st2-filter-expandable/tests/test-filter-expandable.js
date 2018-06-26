import { expect } from 'chai';

import filterExpandable from '..';

describe('filter-expandable', () => {
  it('works for "workflow"', () => {
    expect(filterExpandable({ action: { runner_type: 'workflow' } })).to.equal(true);
  });

  it('works for "action-chain"', () => {
    expect(filterExpandable({ action: { runner_type: 'action-chain' } })).to.equal(true);
  });

  it('works for "mistral-v1"', () => {
    expect(filterExpandable({ action: { runner_type: 'mistral-v1' } })).to.equal(true);
  });

  it('works for "mistral-v2"', () => {
    expect(filterExpandable({ action: { runner_type: 'mistral-v2' } })).to.equal(true);
  });

  it('works for "orchestra"', () => {
    expect(filterExpandable({ action: { runner_type: 'orchestra' } })).to.equal(true);
  });

  it('doesn\'t work for "foobar"', () => {
    expect(filterExpandable({ action: { runner_type: 'foobar' } })).to.equal(false);
  });
});
