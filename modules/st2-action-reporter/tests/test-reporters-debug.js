import { expect } from 'chai';

import { ReactTester } from '@stackstorm/module-test-utils';

import '@stackstorm/module-test-utils/bootstrap/storage';
import reporter from '../reporters/debug';

describe(`ActionReporter: ${reporter.name}`, () => {
  it('works with empty object', () => {
    const instance = ReactTester.create(
      reporter({})
    );

    expect(instance.node).to.equal(undefined);
  });
});
