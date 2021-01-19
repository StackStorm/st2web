// Copyright 2021 The StackStorm Authors.
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
import BooleanField from '../fields/boolean';

describe('AutoForm BooleanField', () => {
  it('produces an element with input as a child', () => {
    const props = {
      name: 'test',
      spec: {},
    };

    const c = new TestComponent(<BooleanField {...props} />);

    expect(c.fieldType()).to.be.equal('input');
  });

  it('calls the callback if value is valid', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {},
      onChange,
    };

    const c = new TestComponent(<BooleanField {...props} />);

    c.makeChange(true, 'checked');

    expect(onChange.withArgs(true)).to.be.calledOnce;

    expect(c.fieldValue('checked')).to.be.equal(true);
    expect(c.value()).to.be.deep.equal(true);
  });

  it('does not change the value or calls the callback if value is invalid', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {},
      onChange,
    };

    const c = new TestComponent(<BooleanField {...props} />);
    c.makeChange('invalid', 'checked');

    expect(onChange.withArgs('invalid')).to.not.be.called;

    expect(c.fieldValue('checked')).to.be.equal(false);
  });

  it('resets the value when reset button is pressed', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {},
      value: false,
      onChange,
    };

    const c = new TestComponent(<BooleanField {...props} />);

    expect(c.fieldValue('checked')).to.be.equal(false);
    expect(c.value()).to.be.deep.equal(false);

    const stopPropagation = sinon.spy();
    c._instance.node.props.onReset({ stopPropagation });

    expect(onChange.withArgs(false)).to.be.calledOnce;
    expect(stopPropagation).to.be.calledOnce;
    expect(c.fieldValue('checked')).to.be.equal(false);
    expect(c.value()).to.be.deep.equal(false);
  });

  it('shows default value when no value is set', () => {
    const props = {
      name: 'test',
      spec: {
        default: true,
      },
      onChange: () => {},
    };

    const c1 = new TestComponent(<BooleanField {...props} />);
    expect(c1.fieldClass()).to.have.string('st2-auto-form__checkbox--default');

    const c2 = new TestComponent(<BooleanField {...props} value={false} />);
    expect(c2.fieldClass()).to.not.have.string('st2-auto-form__checkbox--default');
  });
});
