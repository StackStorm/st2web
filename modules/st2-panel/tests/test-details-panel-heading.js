import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import { DetailsPanelHeading } from '..';

describe(`${DetailsPanelHeading.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <DetailsPanelHeading
          className="foobar"
          title="Title"
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <DetailsPanelHeading
          foo="bar"
          title="Title"
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
