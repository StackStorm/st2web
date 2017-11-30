import React from 'react';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import Textarea from 'react-textarea-autosize';

chai.use(sinonChai);

import { TestComponent } from './utils';
import StringField from '../fields/string';

describe('AutoForm StringField', () => {
  it('produces an element with textarea as a child', () => {
    const props = {
      name: 'test',
      spec: {},
    };

    const c = new TestComponent(<StringField {...props} />);

    expect(c.fieldType()).to.be.equal(Textarea);
  });

  it('changes the value and calls the callback if value is valid', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {},
      onChange,
    };

    const c = new TestComponent(<StringField {...props} />);

    c.makeChange('test');

    expect(onChange.withArgs('test')).to.be.calledOnce;
    expect(c.fieldValue()).to.be.equal('test');
    expect(c.value()).to.be.deep.equal('test');
  });

});
