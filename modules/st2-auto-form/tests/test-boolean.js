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

    expect(c.fieldValue('checked')).to.be.equal('invalid');
  });

  it('resets the value when reset button is pressed', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {
        default: true,
      },
      onChange,
    };

    const c = new TestComponent(<BooleanField {...props} />);

    expect(c.fieldClass()).to.have.string('st2-auto-form__checkbox--default');

    c.makeChange(false, 'checked');

    expect(onChange.withArgs(false)).to.be.calledOnce;
    expect(c.fieldValue('checked')).to.be.equal(false);
    expect(c.value()).to.be.deep.equal(false);
    expect(c.fieldClass()).to.not.have.string('st2-auto-form__checkbox--default');

    const stopPropagation = sinon.spy();
    c._instance.node.props.onReset({ stopPropagation });

    expect(onChange.withArgs(undefined)).to.be.calledOnce;
    expect(stopPropagation).to.be.calledOnce;
    expect(c.fieldValue('checked')).to.be.equal(undefined);
    expect(c.value()).to.be.deep.equal(undefined);
    expect(c.fieldClass()).to.have.string('st2-auto-form__checkbox--default');
  });
});
