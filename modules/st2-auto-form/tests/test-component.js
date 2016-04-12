import React from 'react';
import TestUtils from 'react-addons-test-utils';
import { expect } from 'chai';
const sinon = require('sinon');

const Component = require('../auto-form.component.js');

import StringField from '../fields/string';

describe('AutoForm Component', () => {
  it('produces an empty element when provided a spec with no properties', () => {
    const spec = {
      properties: {}
    };

    const renderer = TestUtils.createRenderer();
    renderer.render(<Component spec={spec} />);
    const output = renderer.getRenderOutput();

    expect(output.props.children).to.be.an('array').of.length(0);
  });

  it('produces a form of single string field for spec of one empty property', () => {
    const spec = {
      properties: {
        test: {}
      }
    };

    const renderer = TestUtils.createRenderer();
    renderer.render(<Component spec={spec} />);
    const output = renderer.getRenderOutput();

    expect(output.props.children).to.be.an('array').of.length(1)
      .with.deep.property('[0].type', StringField);
  });

  it('calls an onChange callback as soon as one on the child element gets called', () => {
    const spec = {
      properties: {
        test: {}
      }
    };
    const onChange = sinon.spy();

    const renderer = TestUtils.createRenderer();
    renderer.render(<Component spec={spec} onChange={onChange}/>);
    const output = renderer.getRenderOutput();

    const [ field ] = output.props.children;
    field.props.onChange('test');

    expect(onChange.withArgs('test').calledOnce).to.be.true;
  });
});
