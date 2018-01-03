import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import { Popup } from '..';

describe(`${Popup.name} Component`, () => {
  before(() => {
    global.document = {
      addEventListener: () => null,
      removeEventListener: () => null,
    };
  });

  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <Popup
          className="foobar"
          onCancel={() => {}}
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <Popup
          foo="bar"
          onCancel={() => {}}
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
