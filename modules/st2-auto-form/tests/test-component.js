import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';
import { expect } from 'chai';
const sinon = require('sinon');

import Component from '../auto-form.component.js';

import StringField from '../fields/string';

function render(component) {
  return ReactTester.create(component).node;
}

describe('AutoForm Component', () => {
  it('produces an empty element when provided a spec with no properties', () => {
    const spec = {
      properties: {},
    };

    const output = render(<Component spec={spec} />);

    expect(output.props.children).to.be.an('array').of.length(0);
  });

  it('produces a form of single string field for spec of one empty property', () => {
    const spec = {
      properties: {
        test: {},
      },
    };

    const output = render(<Component spec={spec} />);

    expect(output.props.children).to.be.an('array').of.length(1)
      .with.nested.property('[0].type', StringField);
  });

  it('calls an onChange callback as soon as one on the child element gets called', () => {
    const spec = {
      properties: {
        test: {},
      },
    };
    const onChange = sinon.spy();

    const output = render(<Component spec={spec} onChange={onChange} />);

    const [ field ] = output.props.children;
    field.props.onChange('test');

    expect(onChange.withArgs({ test: 'test' }).calledOnce).to.be.true;
  });
});
