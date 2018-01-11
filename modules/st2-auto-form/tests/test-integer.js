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
