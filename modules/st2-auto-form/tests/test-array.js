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
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

import { TestComponent } from './utils';
import ArrayField from '../fields/array';

describe('AutoForm ArrayField', () => {
  it('produces an element with textarea as a child', () => {
    const props = {
      name: 'test',
      spec: {},
    };

    const c = new TestComponent(<ArrayField {...props} />);

    expect(c.fieldType()).to.be.equal('input');
  });

  it('calls the callback if value is valid', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {},
      onChange,
    };

    const c = new TestComponent(<ArrayField {...props} />);

    c.makeChange('["t","e","s","t"]');

    expect(onChange.withArgs([ 't','e','s','t' ])).to.be.calledOnce;

    expect(c.fieldValue()).to.be.equal('["t","e","s","t"]');
    expect(c.value()).to.be.deep.equal([ 't','e','s','t' ]);

    c.makeChange('t,e,s,t');

    expect(onChange.withArgs([ 't','e','s','t' ])).to.be.calledTwice;

    expect(c.fieldValue()).to.be.equal('t,e,s,t');
    expect(c.value()).to.be.deep.equal([ 't','e','s','t' ]);
  });

  it('does not change the value or calls the callback if value is invalid', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {
        items: {
          type: 'number',
        },
      },
      onChange,
    };

    const c = new TestComponent(<ArrayField {...props} />);

    c.makeChange('invalid');

    expect(onChange.withArgs('invalid')).to.not.be.called;

    expect(c.fieldValue()).to.be.equal('invalid');

    expect(c.fieldClass()).to.have.string('st2-auto-form__field--invalid');
  });

  it('displays default value as serialized json string', () => {
    const props = {
      name: 'test',
      spec: {
        default: [ 1,2,3 ],
      },
    };

    const c = new TestComponent(<ArrayField {...props} />);
    expect(c.field().props.placeholder).to.be.equal('1, 2, 3');
    
  });

  it('allows you to put a jinja template in the field', () => {
    const c = new TestComponent(<ArrayField />);

    c.makeChange('{{ system.user }}');

    expect(c.fieldValue()).to.be.equal('{{ system.user }}');
    expect(c.value()).to.be.deep.equal('{{ system.user }}');
  });

  it('handles an array of single value', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {},
      onChange,
    };

    const c = new TestComponent(<ArrayField {...props} />);

    c.makeChange('["t"]');

    expect(onChange.withArgs([ 't' ])).to.be.calledOnce;

    expect(c.fieldValue()).to.be.equal('["t"]');
    expect(c.value()).to.be.deep.equal([ 't' ]);

    c.makeChange('t');

    expect(onChange.withArgs([ 't' ])).to.be.calledTwice;

    expect(c.fieldValue()).to.be.equal('t');
    expect(c.value()).to.be.deep.equal([ 't' ]);
  });

  it('handles an array of objects', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {},
      onChange,
    };

    const c = new TestComponent(<ArrayField {...props} />);

    c.makeChange('[{"a": "b", "c": "d"}, {"e": "f"}]');

    expect(onChange.withArgs([{a: 'b', c:'d'}, {e: 'f'}])).to.be.calledOnce;

    expect(c.fieldValue()).to.be.equal('[{"a": "b", "c": "d"}, {"e": "f"}]');
    expect(c.value()).to.be.deep.equal([{a: 'b', c:'d'}, {e: 'f'}]);
  });

  it('treats objects as invalid value', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {},
      onChange,
    };

    const c = new TestComponent(<ArrayField {...props} />);

    c.makeChange('{"a": "b", "c": "d"}');

    expect(onChange.withArgs('invalid')).to.not.be.called;

    expect(c.fieldValue()).to.be.equal('{"a": "b", "c": "d"}');

    expect(c.fieldClass()).to.have.string('st2-auto-form__field--invalid');
  });
});
