// Copyright 2021 The StackStorm Authors.
// Copyright 2020 Extreme Networks, Inc.
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

import OrquestaModel from '../model-orquesta';
import MistralModel from '../model-mistral';

const workflow = (task) => [
  'version: 1.0',
  'tasks:',
  '  task1:',
  '    action: core.noop',
  ...task,
  '',
].join('\n');

const errorsFor = (Model, yaml) => {
  const model = new Model(yaml);
  return model.errors;
};

describe('st2flow-model schema validation', () => {
  it('accepts a valid workflow', () => {
    expect(errorsFor(OrquestaModel, workflow([]))).to.deep.equal([]);
  });

  it('names an unknown property and marks its line', () => {
    const [ error, ...rest ] = errorsFor(OrquestaModel, workflow([ '    bogus: 1' ]));

    expect(rest).to.be.empty;
    expect(error.message).to.equal('tasks.task1 - must NOT have additional properties ("bogus")');
    expect(error.mark.row).to.equal(4);
  });

  it('lists the alternatives when a value matches none of them', () => {
    const [ error ] = errorsFor(OrquestaModel, workflow([ '    delay: [ 1 ]' ]));

    expect(error.message).to.equal('tasks.task1.delay must be string OR tasks.task1.delay must be integer');
    expect(error.mark.row).to.equal(4);
  });

  it('reports the failing alternative when one is not a type error', () => {
    const [ error ] = errorsFor(OrquestaModel, workflow([ '    join: -1' ]));

    expect(error.message).to.equal('tasks.task1.join - must be equal to one of the allowed values');
    expect(error.mark.row).to.equal(4);
  });

  it('accepts the with-items shorthand, like orquesta', () => {
    expect(errorsFor(OrquestaModel, workflow([ '    with: "{{ ctx().xs }}"' ]))).to.deep.equal([]);
    expect(errorsFor(OrquestaModel, workflow([ '    with: <% ctx(xs) %>' ]))).to.deep.equal([]);
    expect(errorsFor(OrquestaModel, workflow([ '    with: x in {{ ctx().xs }}' ]))).to.deep.equal([]);
    expect(errorsFor(OrquestaModel, workflow([ '    with:', '      items: "{{ ctx().xs }}"', '      concurrency: 2' ]))).to.deep.equal([]);
  });

  it('still checks a with-items shorthand against the items pattern, marking the with line', () => {
    const [ error, ...rest ] = errorsFor(OrquestaModel, workflow([ '    with: not an expression' ]));

    expect(rest).to.be.empty;
    expect(error.message).to.match(/^tasks\.task1\.with\.items - must match pattern/);
    expect(error.mark.row).to.equal(4);
  });

  it('leaves the workflow YAML in its shorthand form', () => {
    const model = new OrquestaModel(workflow([ '    with: "{{ ctx().xs }}"' ]));

    expect(model.toYAML()).to.contain('with: "{{ ctx().xs }}"');
    // the task getter has always expanded it for the details panel
    expect(model.tasks[0].with).to.deep.equal({ items: '{{ ctx().xs }}' });
  });

  it('reports type errors', () => {
    const [ error ] = errorsFor(OrquestaModel, workflow([ '    action: 5' ]).replace('    action: core.noop\n', ''));

    expect(error.message).to.equal('tasks.task1.action - must be string');
    expect(error.mark.row).to.equal(3);
  });

  it('compiles schemas with non-standard keywords', () => {
    const errors = errorsFor(MistralModel, [
      'version: \'2.0\'',
      'main:',
      '  type: direct',
      '  tasks:',
      '    task1:',
      '      action: core.noop',
      '',
    ].join('\n'));

    expect(errors).to.deep.equal([]);
  });
});
