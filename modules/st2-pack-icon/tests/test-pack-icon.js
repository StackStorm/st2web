import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import '@stackstorm/module-test-utils/bootstrap/st2constants';
import '@stackstorm/module-test-utils/bootstrap/location';
import api from '@stackstorm/module-api';

import PackIcon from '..';

describe(`${PackIcon.name} Component`, () => {
  before(() => {
    api.client = api.initClient({}, 'api.token');
  });

  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <PackIcon
          className="foobar"
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <PackIcon
          foo="bar"
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
