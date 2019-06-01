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
import EnumField from '../fields/enum';

describe('AutoForm EnumField', () => {
  it('produces an element with textarea as a child', () => {
    const props = {
      name: 'test',
      spec: {},
    };

    const c = new TestComponent(<EnumField {...props} />);

    expect(c.fieldType()).to.be.equal('select');
  });

  it('calls the callback if value is valid', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {
        enum: [ 'test' ],
      },
      onChange,
    };

    const c = new TestComponent(<EnumField {...props} />);

    c.makeChange('test');

    expect(onChange.withArgs('test')).to.be.calledOnce;
    expect(c.fieldValue()).to.be.equal('test');
    expect(c.value()).to.be.deep.equal('test');
  });

  it('does not change the value or calls the callback if value is invalid', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {
        enum: [ 'test' ],
      },
      onChange,
    };

    const c = new TestComponent(<EnumField {...props} />);

    c.makeChange('invalid');

    expect(onChange.withArgs('invalid')).to.not.be.called;

    expect(c.fieldValue()).to.be.equal('invalid');

    expect(c.fieldClass()).to.have.string('st2-auto-form__field--invalid');
  });
});
