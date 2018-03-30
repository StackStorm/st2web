import React from 'react';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

import { TestComponent } from './utils';
import { BaseTextareaField, Textarea } from '../fields/base';

class BaseTextareaFieldStub extends BaseTextareaField {
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

describe('AutoForm BaseTextareaField', () => {
  it('produces an element with input as a child', () => {
    const props = {
      name: 'test',
      spec: {},
    };

    const c = new TestComponent(<BaseTextareaFieldStub {...props} />);

    expect(c.fieldType()).to.be.equal(Textarea);
  });

  it('invokes onChange callback the moment child\'s onChange callback is called', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {},
      onChange,
    };

    const c = new TestComponent(<BaseTextareaFieldStub {...props} />);

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

    const c = new TestComponent(<BaseTextareaFieldStub {...props} />);

    c.makeChange('invalid');

    expect(onChange.withArgs('invalid')).to.not.be.called;
    expect(c.fieldValue()).to.be.equal('invalid');
    expect(c.fieldClass()).to.have.string('st2-auto-form__field--invalid');
  });
});
