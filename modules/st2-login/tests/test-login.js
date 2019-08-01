// Copyright 2019 Extreme Networks, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import '@stackstorm/module-test-utils/bootstrap/st2constants';
import '@stackstorm/module-test-utils/bootstrap/storage';
import '@stackstorm/module-test-utils/bootstrap/location';
import Login from '..';

describe(`${Login.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <Login
          className="foobar"
          onConnect={() => {}}
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <Login
          foo="bar"
          onConnect={() => {}}
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });

  it('works with no hosts', () => {
    window.st2constants.st2Config = {
      hosts: undefined,
    };

    const instance = ReactTester.create(
      <Login
        onConnect={() => {}}
      />
    );

    expect(instance.node.children[0].type.name).to.equal('LoginForm');
    expect(instance.node.children[0].props.children[1]).to.equal(null);
    expect(instance.node.children[0].props.children[2]).to.equal(null);
    expect(instance.node.children[0].props.children[3].type.name).to.equal('LoginRow');
    expect(instance.node.children[0].props.children[3].props.children.type).to.equal('input');
    expect(instance.node.children[0].props.children[3].props.children.props.name).to.equal('username');

    window.st2constants.st2Config = {};
  });

  it('works with one host', () => {
    window.st2constants.st2Config = {
      hosts: [
        {
          name: 'Dev Env',
          url: '//172.168.50.50:9101/api',
          auth: '//172.168.50.50:9101/auth',
        },
      ],
    };

    const instance = ReactTester.create(
      <Login
        onConnect={() => {}}
      />
    );

    expect(instance.node.children[0].type.name).to.equal('LoginForm');
    expect(instance.node.children[0].props.children[1]).to.equal(null);
    expect(instance.node.children[0].props.children[2]).to.equal(null);
    expect(instance.node.children[0].props.children[3].type.name).to.equal('LoginRow');
    expect(instance.node.children[0].props.children[3].props.children.type).to.equal('input');
    expect(instance.node.children[0].props.children[3].props.children.props.name).to.equal('username');

    window.st2constants.st2Config = {};
  });

  it('works with multiple hosts', () => {
    window.st2constants.st2Config = {
      hosts: [
        {
          name: 'Dev Env',
          url: '//172.168.50.50:9101/api',
          auth: '//172.168.50.50:9101/auth',
        },
        {
          name: 'Express',
          url: '//172.168.90.50:9101/api',
          auth: '//172.168.90.50:9101/auth',
        },
      ],
    };

    const instance = ReactTester.create(
      <Login
        onConnect={() => {}}
      />
    );

    expect(instance.node.children[0].type.name).to.equal('LoginForm');
    expect(instance.node.children[0].props.children[1]).to.equal(null);
    expect(instance.node.children[0].props.children[2].type.name).to.equal('LoginRow');
    expect(instance.node.children[0].props.children[2].props.children.type).to.equal('select');
    expect(instance.node.children[0].props.children[2].props.children.props.children).to.be.an('array').with.lengthOf(2);
    expect(instance.node.children[0].props.children[3].type.name).to.equal('LoginRow');
    expect(instance.node.children[0].props.children[3].props.children.type).to.equal('input');
    expect(instance.node.children[0].props.children[3].props.children.props.name).to.equal('username');

    window.st2constants.st2Config = {};
  });
});
