import React from 'react';
import TestUtils from 'react-addons-test-utils';
import { expect } from 'chai';
import sinon from 'sinon';

import { BaseTextField } from '../fields/base';

class BaseTextFieldStub extends BaseTextField {
  fromStateValue(v) {
    return v;
  }

  toStateValue(v) {
    return v;
  }

  validate(v) {
    return v !== 'invalid';
  }
}

describe('AutoForm BaseTextField', () => {
  it('produces an element with input as a child', () => {
    const props = {
      name: 'test',
      spec: {}
    };

    const renderer = TestUtils.createRenderer();
    renderer.render(<BaseTextFieldStub {...props} />);
    const output = renderer.getRenderOutput();

    expect(output.props.children).to.have.property('type', 'input');
  });

  it('invokes onChange callback the moment child\'s onChange callback is called', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {},
      onChange
    };

    const renderer = TestUtils.createRenderer();
    renderer.render(<BaseTextFieldStub {...props} />);

    const event = { target: { value: 'test' } };
    const field = renderer.getRenderOutput().props.children;
    field.props.onChange(event);

    const output = renderer.getRenderOutput();

    expect(onChange.withArgs('test').calledOnce).to.be.true;
    expect(output.props.children).to.have.deep.property('props.value', 'test');
  });

  it('does not invoke onChange callback if validation fails instead sets a class', () => {
    const onChange = sinon.spy();
    const props = {
      name: 'test',
      spec: {},
      onChange
    };

    const renderer = TestUtils.createRenderer();
    renderer.render(<BaseTextFieldStub {...props} />);

    const event = { target: { value: 'invalid' } };
    const field = renderer.getRenderOutput().props.children;
    field.props.onChange(event);

    const output = renderer.getRenderOutput();

    expect(onChange.withArgs('invalid').calledOnce).to.be.false;
    expect(output.props.children).to.have.deep.property('props.value', 'invalid');
    expect(output.props.children).to.have.deep.property('props.className')
      .that.have.string('st2-auto-form__field--invalid');
  });
});
