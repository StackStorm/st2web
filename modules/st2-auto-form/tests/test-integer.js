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
import IntegerField from '../fields/integer';

describe('AutoForm IntegerField', () => {
  it('produces an element with input as a child', () => {
    const props = {
      name: 'test',
      spec: {},
    };

    const c = new TestComponent(<IntegerField {...props} />);

    expect(c.fieldType()).to.be.equal('input');
  });

  it('calls the callback if value is valid', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {},
      onChange,
    };

    const c = new TestComponent(<IntegerField {...props} />);

    c.makeChange('1');

    expect(onChange.withArgs(1)).to.be.calledOnce;

    expect(c.fieldValue()).to.be.equal('1');
    expect(c.value()).to.be.deep.equal(1);
  });

  it('does not change the value or calls the callback if value is invalid', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {},
      onChange,
    };

    const c = new TestComponent(<IntegerField {...props} />);

    c.makeChange('invalid');

    expect(onChange.withArgs('invalid')).to.not.be.called;

    expect(c.fieldValue()).to.be.equal('invalid');

    expect(c.fieldClass()).to.have.string('st2-auto-form__field--invalid');
  });

  it('does not allow you to put a float in the field', () => {
    const c = new TestComponent(<IntegerField />);

    c.makeChange('invalid');

    expect(c.fieldValue()).to.be.equal('invalid');
  });

  it('allows you to put a jinja template in the field', () => {
    const c = new TestComponent(<IntegerField />);

    c.makeChange('{{ system.user }}');

    expect(c.fieldValue()).to.be.equal('{{ system.user }}');
    expect(c.value()).to.be.deep.equal('{{ system.user }}');
  });
});
