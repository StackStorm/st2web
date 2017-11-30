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
