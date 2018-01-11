import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import { FlexTableRow } from '..';

describe(`${FlexTableRow.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <FlexTableRow
          className="foobar"
          columns={[]}
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <FlexTableRow
          foo="bar"
          columns={[]}
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
