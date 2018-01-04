import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import '@stackstorm/module-test-utils/bootstrap/document';
import RemoteForm from '..';

describe(`${RemoteForm.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <RemoteForm
          className="foobar"
          name="name"
          spec={{
            enum: [],
          }}
          data={{}}
          onChange={() => {}}
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <RemoteForm
          foo="bar"
          name="name"
          spec={{
            enum: [],
          }}
          data={{}}
          onChange={() => {}}
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
