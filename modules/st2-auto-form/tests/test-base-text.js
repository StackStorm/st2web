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
import { BaseTextField } from '../fields/base';

class BaseTextFieldStub extends BaseTextField {
  fromStateValue(v) {
    return v;
  }

  toStateValue(v) {
    return v;
  }

  validate(v) {
    return v === 'invalid' && 'invalid message';
  }
}

describe('AutoForm BaseTextField', () => {
  it('produces an element with input as a child', () => {
    const props = {
      name: 'test',
      spec: {},
    };

    const c = new TestComponent(<BaseTextFieldStub {...props} />);

    expect(c.fieldType()).to.be.equal('input');
  });

  it('invokes onChange callback the moment child\'s onChange callback is called', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {},
      onChange,
    };

    const c = new TestComponent(<BaseTextFieldStub {...props} />);

    c.makeChange('test');

    expect(onChange.withArgs('test')).to.be.calledOnce;
    expect(c.fieldValue()).to.be.equal('test');
  });

  it('does not invoke onChange callback if validation fails instead sets a class', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {},
      onChange,
    };

    const c = new TestComponent(<BaseTextFieldStub {...props} />);

    c.makeChange('invalid');

    expect(onChange.withArgs('invalid')).to.not.be.called;
    expect(c.fieldValue()).to.be.equal('invalid');
    expect(c.fieldClass()).to.have.string('st2-auto-form__field--invalid');
  });
});
