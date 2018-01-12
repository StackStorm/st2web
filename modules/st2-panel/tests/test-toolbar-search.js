import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import { ToolbarSearch } from '..';

describe(`${ToolbarSearch.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <ToolbarSearch
          className="foobar"
          title="Title"
          value="value"
          onChange={() => {}}
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <ToolbarSearch
          foo="bar"
          title="Title"
          value="value"
          onChange={() => {}}
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
