import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import { DetailsPanelBodyLine } from '..';

describe(`${DetailsPanelBodyLine.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <DetailsPanelBodyLine
          className="foobar"
          label="label"
        >
          Value
        </DetailsPanelBodyLine>
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <DetailsPanelBodyLine
          foo="bar"
          label="label"
        >
          Value
        </DetailsPanelBodyLine>
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
