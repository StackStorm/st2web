import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import '@stackstorm/module-test-utils/bootstrap/misc';
import '@stackstorm/module-test-utils/bootstrap/st2constants';
import '@stackstorm/module-test-utils/bootstrap/location';
import api from '@stackstorm/module-api';

import FlowLinkBase from '..';

class FlowLink extends FlowLinkBase {
  getUrlProps() {
    return {};
  }
}

describe(`${FlowLink.name} Component`, () => {
  before(() => {
    api.client = api.connect();
  });

  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <FlowLink
          className="foobar"
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <FlowLink
          foo="bar"
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
