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

import { describe, it } from '@rstest/core';
import { fireEvent } from '@testing-library/react';
import { renderNode } from '@stackstorm/module-test-utils';
import { expect } from 'chai';
import sinon from 'sinon';

import AutoForm from '..';

// the input (or textarea) of the field for a parameter
const field = (form, name) => form.querySelector(`.st2-auto-form__field[data-test="field:${name}"]`);

describe(`${AutoForm.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = renderNode(
        <AutoForm
          className="foobar"
        />
      );

      expect(instance.classList.contains('foobar')).to.be.true;
    });

    it('proxies extra props', () => {
      const instance = renderNode(
        <AutoForm
          foo="bar"
        />
      );

      expect(instance.getAttribute('foo')).to.equal('bar');
    });
  });

  it('produces an empty element when provided a spec with no properties', () => {
    const spec = {
      properties: {},
    };

    const output = renderNode(<AutoForm spec={spec} />);

    expect(output.children).to.have.length(0);
  });

  it('produces a form of single string field for spec of one empty property', () => {
    const spec = {
      properties: {
        test: {},
      },
    };

    const output = renderNode(<AutoForm spec={spec} />);

    expect(output.children).to.have.length(1);
    // a string field edits its value in a textarea
    expect(field(output, 'test').tagName).to.equal('TEXTAREA');
  });

  it('calls an onChange callback as soon as one on the child element gets called', () => {
    const spec = {
      properties: {
        test: {},
      },
    };

    const onChange = sinon.spy();

    const output = renderNode(<AutoForm spec={spec} onChange={onChange} />);

    fireEvent.change(field(output, 'test'), { target: { value: 'test' } });

    expect(onChange.withArgs({ test: 'test' }).calledOnce).to.be.true;
  });

  it('calls an onChange callback as soon as one on the child element gets called', () => {
    const spec = {
      properties: {
        enumed: {
          default: 'world',
          enum: [ 'hello', 'world' ],
        },
        defaulted: {
          type: 'string',
          default: 'foobar',
        },
        other: {
          type: 'string',
        },
      },
    };

    const onChange = sinon.spy();

    const output = renderNode(<AutoForm spec={spec} onChange={onChange} />);

    fireEvent.change(field(output, 'other'), { target: { value: 'test' } });

    expect(onChange.withArgs({ enumed: 'world', other: 'test' }).calledOnce).to.be.true;
  });
});
