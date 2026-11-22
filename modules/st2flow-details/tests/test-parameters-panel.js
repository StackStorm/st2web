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

import { Provider } from 'react-redux';
import { legacy_createStore as createStore } from 'redux';
import { render, fireEvent, within } from '@testing-library/react';

import MetaModel from '@stackstorm/st2flow-model/model-meta';

import Parameters from '../parameters-panel';
import ParameterEditor from '../parameter-editor';

import style from '../style.module.css';

const META = [
  'pack: examples',
  'name: my_wf',
  'runner_type: orquesta',
  'parameters:',
  '  which:',
  '    type: string',
  '    description: Which path to take',
  '    required: true',
  '    position: 1',
  '  count:',
  '    type: integer',
  '    description: How many times',
  '    position: 0',
  '  token:',
  '    type: string',
  '    secret: true',
  '',
].join('\n');

// A store that records what the panel dispatches.
function renderParameters(meta = new MetaModel(META).tokenSet.toObject()) {
  const actions = [];
  const store = createStore((state = { flow: { meta }}, action) => {
    if (!action.type.startsWith('@@')) {
      actions.push(action);
    }
    return state;
  });

  return {
    ...render(
      <Provider store={store}>
        <Parameters />
      </Provider>
    ),
    actions,
  };
}

// the input of the auto-form field titled `name`
const field = (container, name) => {
  const title = Array.from(container.querySelectorAll('.st2-auto-form__title'))
    .find(t => t.textContent.replace(/ \*$/, '') === name);
  return title.closest('label').querySelector('textarea, input, select');
};

const error = (container, name) => {
  const message = field(container, name).closest('label').querySelector('.st2-auto-form__error');
  return message && message.textContent;
};

// the switch of a required/immutable/secret toggle (a property's first line is its name)
const toggle = (container, name) => {
  const property = Array.from(container.querySelectorAll(`.${style.property}`))
    .find(p => p.firstElementChild.textContent === name);
  return property.querySelector('input[type="checkbox"]');
};

const parameterRows = container => Array.from(container.querySelectorAll(`.${style.parameter}`));

// the parameters each meta command set
const setParameters = actions => actions.map(({ type, command, args: [ field, value ] }) => {
  expect([ type, command, field ]).to.deep.equal([ 'META_ISSUE_COMMAND', 'set', 'parameters' ]);
  return value;
});

describe('st2flow-details Parameters panel', () => {
  it('lists the parameters with their description and flags', () => {
    const { container } = renderParameters();

    const rows = parameterRows(container);
    expect(rows.map(r => r.querySelector(`.${style.parameterName}`).textContent)).to.deep.equal([ 'which', 'count', 'token' ]);
    expect(rows[0].querySelector(`.${style.parameterDescription}`).textContent).to.equal('Which path to take');

    const active = row => Array.from(row.querySelectorAll(`.${style.parameterToken}.${style.active}`)).map(t => t.textContent);
    expect(active(rows[0])).to.deep.equal([ 'required' ]);
    expect(active(rows[1])).to.deep.equal([]);
    expect(active(rows[2])).to.deep.equal([ 'secret' ]);
  });

  it('shows only the add button when there are no parameters', () => {
    const { container, getByDisplayValue } = renderParameters(new MetaModel('pack: examples\n').tokenSet.toObject());

    expect(parameterRows(container)).to.have.length(0);
    expect(getByDisplayValue('Add parameter')).to.exist;
  });

  it('deletes a parameter', () => {
    const { container, actions } = renderParameters();

    fireEvent.click(parameterRows(container)[0].querySelector('.icon-delete'));

    const [ parameters ] = setParameters(actions);
    expect(Object.keys(parameters)).to.deep.equal([ 'count', 'token' ]);
    expect(parameters.count).to.deep.equal({ type: 'integer', description: 'How many times', position: 0 });
  });

  it('adds a parameter after the positioned ones', () => {
    const { container, getByText, getByDisplayValue, actions } = renderParameters();

    fireEvent.click(getByDisplayValue('Add parameter'));
    expect(getByText('New parameter')).to.exist;
    expect(parameterRows(container)).to.have.length(0);

    fireEvent.change(field(container, 'Name'), { target: { value: 'extra' } });
    fireEvent.change(field(container, 'Type'), { target: { value: 'boolean' } });
    fireEvent.change(field(container, 'Description'), { target: { value: 'An extra one' } });
    fireEvent.click(toggle(container, 'immutable'));
    fireEvent.submit(container.querySelector('form'));

    const [ parameters ] = setParameters(actions);
    // sorted by position, unpositioned ones last
    expect(Object.keys(parameters)).to.deep.equal([ 'count', 'which', 'token', 'extra' ]);
    expect(parameters.extra).to.deep.equal({ type: 'boolean', description: 'An extra one', immutable: true });

    // back to the list
    expect(container.querySelector('form')).to.equal(null);
  });

  it('cancels adding a parameter without a change', () => {
    const { container, getByDisplayValue, actions } = renderParameters();

    fireEvent.click(getByDisplayValue('Add parameter'));
    fireEvent.change(field(container, 'Name'), { target: { value: 'extra' } });
    fireEvent.click(getByDisplayValue('Cancel'));

    expect(actions).to.deep.equal([]);
    expect(parameterRows(container)).to.have.length(3);
  });

  it('edits a parameter in place', () => {
    const { container, getByText, actions } = renderParameters();

    fireEvent.click(parameterRows(container)[0].querySelector('.icon-edit'));

    expect(getByText('Edit parameter')).to.exist;
    expect(field(container, 'Name').value).to.equal('which');
    expect(field(container, 'Type').value).to.equal('string');
    expect(field(container, 'Description').value).to.equal('Which path to take');
    expect(field(container, 'Position').value).to.equal('1');
    expect(toggle(container, 'required').checked).to.be.true;

    fireEvent.change(field(container, 'Enum'), { target: { value: 'a, b' } });
    fireEvent.change(field(container, 'Default'), { target: { value: 'a' } });
    fireEvent.click(toggle(container, 'required'));
    fireEvent.submit(container.querySelector('form'));

    const [ parameters ] = setParameters(actions);
    expect(Object.keys(parameters)).to.deep.equal([ 'count', 'which', 'token' ]);
    expect(parameters.which).to.deep.equal({
      type: 'string',
      description: 'Which path to take',
      required: false,
      position: 1,
      enum: [ 'a', 'b' ],
      default: 'a',
    });
  });

  it('renames a parameter and re-sorts by the new position', () => {
    const { container, actions } = renderParameters();

    fireEvent.click(parameterRows(container)[2].querySelector('.icon-edit'));
    fireEvent.change(field(container, 'Name'), { target: { value: 'api_token' } });
    fireEvent.change(field(container, 'Position'), { target: { value: '0' } });
    fireEvent.submit(container.querySelector('form'));

    const [ parameters ] = setParameters(actions);
    // ties keep their order, so it lands after count but ahead of which
    expect(Object.keys(parameters)).to.deep.equal([ 'count', 'api_token', 'which' ]);
    expect(parameters.api_token).to.deep.equal({ type: 'string', secret: true, position: 0 });
  });
});

describe('st2flow-details ParameterEditor', () => {
  it('flags a missing name and type as required', () => {
    const { container } = render(<ParameterEditor parameter={{ name: 'p', type: 'string' }} onChange={() => {}} onCancel={() => {}} />);

    fireEvent.change(field(container, 'Name'), { target: { value: '' } });
    fireEvent.change(field(container, 'Type'), { target: { value: '' } });

    expect(error(container, 'Name')).to.equal('parameter is required');
    expect(error(container, 'Type')).to.equal('parameter is required');
  });

  it('flags a position that is not an integer and keeps the last valid one', () => {
    const onChange = sinon.spy();
    const { container } = render(<ParameterEditor parameter={{ name: 'p', type: 'string', position: 2 }} onChange={onChange} onCancel={() => {}} />);

    fireEvent.change(field(container, 'Position'), { target: { value: 'first' } });
    expect(error(container, 'Position')).to.equal('\'first\' is not an integer');

    fireEvent.submit(container.querySelector('form'));
    expect(onChange.firstCall.args[0].position).to.equal(2);
  });

  it('labels the form for adding when given no parameter', () => {
    const { getByText, getByDisplayValue } = render(<ParameterEditor onChange={() => {}} onCancel={() => {}} />);

    expect(getByText('New parameter')).to.exist;
    expect(getByDisplayValue('Add').type).to.equal('submit');
  });

  it('calls onCancel from the cancel button', () => {
    const onCancel = sinon.spy();
    const onChange = sinon.spy();
    const { getByDisplayValue } = render(<ParameterEditor parameter={{ name: 'p' }} onChange={onChange} onCancel={onCancel} />);

    fireEvent.click(getByDisplayValue('Cancel'));

    expect(onCancel.calledOnce).to.be.true;
    expect(onChange.called).to.be.false;
  });

  it('shows the parameter flags as toggles', () => {
    const { container } = render(<ParameterEditor parameter={{ name: 'p', secret: true }} onChange={() => {}} onCancel={() => {}} />);

    const flags = Array.from(container.querySelectorAll(`.${style.property}`));
    expect(flags.map(f => within(f).getByText(/^(required|immutable|secret)$/).textContent)).to.deep.equal([ 'required', 'immutable', 'secret' ]);
    expect(flags.map(f => f.querySelector('input').checked)).to.deep.equal([ false, false, true ]);
  });
});
