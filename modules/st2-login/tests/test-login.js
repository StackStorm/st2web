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

import { describe, it } from '@rstest/core';
import { expect } from 'chai';

import { renderNode } from '@stackstorm/module-test-utils';

import '@stackstorm/module-test-utils/bootstrap/st2constants';
import '@stackstorm/module-test-utils/bootstrap/storage';
import '@stackstorm/module-test-utils/bootstrap/location';
import Login from '..';

const loginForm = (node) => node.querySelector('[data-test="login"]');

describe(`${Login.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = renderNode(
        <Login
          className="foobar"
          onConnect={() => {}}
        />
      );

      expect(instance.classList.contains('foobar')).to.be.true;
    });

    it('proxies extra props', () => {
      const instance = renderNode(
        <Login
          foo="bar"
          onConnect={() => {}}
        />
      );

      expect(instance.getAttribute('foo')).to.equal('bar');
    });
  });

  it('styles the form as a box', () => {
    // a typo (style.from) once left the form without its class
    const instance = renderNode(
      <Login
        onConnect={() => {}}
      />
    );

    expect(loginForm(instance).className).to.equal(Login.defaultProps.style.form);
  });

  it('works with no hosts', () => {
    window.st2constants.st2Config = {
      hosts: undefined,
    };

    const instance = renderNode(
      <Login
        onConnect={() => {}}
      />
    );

    const form = loginForm(instance);
    expect(form.tagName).to.equal('FORM');
    // no server picker for a single (or default) server
    expect(form.querySelector('select')).to.be.null;
    expect(form.querySelector('input[name="username"]')).to.exist;

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

    const instance = renderNode(
      <Login
        onConnect={() => {}}
      />
    );

    const form = loginForm(instance);
    expect(form.tagName).to.equal('FORM');
    // no server picker for a single (or default) server
    expect(form.querySelector('select')).to.be.null;
    expect(form.querySelector('input[name="username"]')).to.exist;

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

    const instance = renderNode(
      <Login
        onConnect={() => {}}
      />
    );

    const form = loginForm(instance);
    expect(form.tagName).to.equal('FORM');
    // a server picker listing both servers, then the credentials
    const select = form.querySelector('select');
    expect([ ...select.options ].map(o => o.textContent)).to.deep.equal([ '* Dev Env', '* Express' ]);
    const [ first, second ] = form.querySelectorAll('select, input[name="username"]');
    expect([ first, second ].map(e => e.tagName)).to.deep.equal([ 'SELECT', 'INPUT' ]);

    window.st2constants.st2Config = {};
  });
});
