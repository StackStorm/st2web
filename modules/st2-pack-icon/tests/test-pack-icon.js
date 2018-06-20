import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import moxios from 'moxios';

import '@stackstorm/module-test-utils/bootstrap/st2constants';
import '@stackstorm/module-test-utils/bootstrap/location';

import PackIcon from '..';

describe(`${PackIcon.name} Component`, () => {
  before(() => moxios.install());
  after(() => moxios.uninstall());

  describe('common functionality', () => {
    moxios.stubRequest('https://example.com/api/v1/packs', {
      status: 200,
      response: [],
    });

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
