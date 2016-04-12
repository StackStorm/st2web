import React from 'react';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import Textarea from 'react-textarea-autosize';

chai.use(sinonChai);

import { TestComponent } from './utils';
import ObjectField from '../fields/object';

describe('AutoForm ObjectField', () => {
  it('produces an element with textarea as a child', () => {
    const props = {
      name: 'test',
      spec: {}
    };

    const c = new TestComponent(<ObjectField {...props} />);

    expect(c.fieldType()).to.be.equal(Textarea);
  });

  it('changes the value and calls the callback if value is valid', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {},
      onChange
    };

    const c = new TestComponent(<ObjectField {...props} />);

    c.makeChange('{"a":"b"}');

    expect(onChange.withArgs({a:'b'})).to.be.calledOnce;

    expect(c.fieldValue()).to.be.equal('{"a":"b"}');
    expect(c.value()).to.be.deep.equal({a:'b'});
  });

  it('does not change the value or calls the callback if value is invalid', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {},
      onChange
    };

    const c = new TestComponent(<ObjectField {...props} />);

    c.makeChange('invalid');

    expect(onChange.withArgs('invalid')).to.not.be.called;

    expect(c.fieldValue()).to.be.equal('invalid');
    expect(() => c.value()).to.throw(SyntaxError);

    expect(c.fieldClass()).to.have.string('st2-auto-form__field--invalid');
  });
});
