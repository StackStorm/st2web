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

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';
import { expect } from 'chai';
import sinon from 'sinon';

import AutoForm from '..';
import StringField from '../fields/string';

describe(`${AutoForm.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <AutoForm
          className="foobar"
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <AutoForm
          foo="bar"
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });

  it('produces an empty element when provided a spec with no properties', () => {
    const spec = {
      properties: {},
    };

    const output = ReactTester.create(<AutoForm spec={spec} />);

    expect(output.node.props.children).to.be.an('array').of.length(0);
  });

  it('produces a form of single string field for spec of one empty property', () => {
    const spec = {
      properties: {
        test: {},
      },
    };

    const output = ReactTester.create(<AutoForm spec={spec} />);

    expect(output.node.props.children).to.be.an('array').of.length(1)
      .with.nested.property('[0].type', StringField);
  });

  it('calls an onChange callback as soon as one on the child element gets called', () => {
    const spec = {
      properties: {
        test: {},
      },
    };

    const onChange = sinon.spy();

    const output = ReactTester.create(<AutoForm spec={spec} onChange={onChange} />);

    const [ field ] = output.node.props.children;
    field.props.onChange('test');

    expect(onChange.withArgs({ test: 'test' }).calledOnce).to.be.true;
  });

  it('calls an onChange callback as soon as one on the child element gets called', () => {
    const spec = {
      properties: {
        enumed: {
          default: 'world',
          enum: [ 'hello', 'world' ],
        },
        defaulted: {
          type: 'string',
          default: 'foobar',
        },
        other: {
          type: 'string',
        },
      },
    };

    const onChange = sinon.spy();

    const output = ReactTester.create(<AutoForm spec={spec} onChange={onChange} />);

    const [ , , other ] = output.node.props.children;
    other.props.onChange('test');

    expect(onChange.withArgs({ enumed: 'world', other: 'test' }).calledOnce).to.be.true;
  });
});
