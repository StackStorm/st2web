import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import '@stackstorm/module-test-utils/bootstrap/storage';
import ActionReporter from '..';

describe(`${ActionReporter.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <ActionReporter
          className="foobar"
          runner="noop"
          execution={{}}
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <ActionReporter
          foo="bar"
          runner="noop"
          execution={{}}
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
