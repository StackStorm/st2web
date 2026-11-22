// Copyright 2026 The StackStorm Authors.
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
import { expect } from 'chai';
import sinon from 'sinon';

import { render, screen, fireEvent } from '@testing-library/react';
import { renderNode } from '@stackstorm/module-test-utils';

import Button, { Toggle } from '../button.component';

describe('st2-forms', () => {
  describe('Button', () => {
    it('renders a plain button input with the given value', () => {
      const node = renderNode(<Button value="Run" />);

      expect(node.tagName).to.equal('INPUT');
      expect(node.type).to.equal('button');
      expect(node.value).to.equal('Run');
      expect(node.className).to.equal('st2-forms__button');
    });

    it('becomes a submit input when asked to', () => {
      expect(renderNode(<Button submit value="Save" />).type).to.equal('submit');
    });

    it('adds modifier classes and keeps the given className', () => {
      const node = renderNode(<Button className="foobar" small flat red value="Delete" />);

      expect([ ...node.classList ]).to.have.members([
        'st2-forms__button',
        'foobar',
        'st2-forms__button--small',
        'st2-forms__button--flat',
        'st2-forms__button--red',
      ]);
    });

    it('passes other props through, including handlers', () => {
      const onClick = sinon.spy();
      const node = renderNode(<Button value="Go" data-test="go" onClick={onClick} />);

      expect(node.getAttribute('data-test')).to.equal('go');
      expect(node.hasAttribute('small')).to.be.false;

      fireEvent.click(node);
      expect(onClick.calledOnce).to.be.true;
    });
  });

  describe('Toggle', () => {
    it('renders a checkbox labelled by its title', () => {
      render(<Toggle title="Enabled" value={true} />);

      const checkbox = screen.getByLabelText('Enabled');
      expect(checkbox.type).to.equal('checkbox');
      expect(checkbox.checked).to.be.true;
    });

    it('treats a missing value as unchecked', () => {
      render(<Toggle title="Enabled" />);

      expect(screen.getByLabelText('Enabled').checked).to.be.false;
    });

    it('reports the new checked state on change', () => {
      const onChange = sinon.spy();
      render(<Toggle title="Enabled" value={false} onChange={onChange} />);

      fireEvent.click(screen.getByLabelText('Enabled'));

      expect(onChange.calledOnceWith(true)).to.be.true;
    });

    it('does not fail without an onChange handler', () => {
      render(<Toggle title="Enabled" value={false} />);

      expect(() => fireEvent.click(screen.getByLabelText('Enabled'))).not.to.throw();
    });

    it('gives each toggle its own label target', () => {
      render(
        <div>
          <Toggle title="First" />
          <Toggle title="Second" />
        </div>
      );

      expect(screen.getByLabelText('First')).not.to.equal(screen.getByLabelText('Second'));
    });
  });
});
