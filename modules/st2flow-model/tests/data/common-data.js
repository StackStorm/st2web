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

import MistralModel from '../../model-mistral';
import OruestaModel from '../../model-orquesta';

const name = 'Common Name';
const description = 'Common Description';
const tasks = [{
  name: 't1',
  action: 'core.local',
  coords: { x: 100, y: 100 },
  input: {
    cmd: 'echo "Task1"',
  },
}, {
  name: 't2',
  action: 'core.local',
  coords: { x: 200, y: 200 },
  input: {
    cmd: 'echo "Task2"',
  },
}, {
  name: 't3',
  action: 'core.local',
  coords: { x: 300, y: 300 },
  input: {
    cmd: 'echo "Task3"',
  },
}, {
  name: 't4',
  action: 'core.local',
  coords: { x: 400, y: 400 },
  input: {
    cmd: 'echo "Task4"',
  },
}];

const transitions = [{
  from: { name: 't1' },
  to: [{ name: 't2' }],
  condition: '<% some_condition_1() %>',
}, {
  from: { name: 't1' },
  to: [{ name: 't3' }],
  condition: '<% some_condition_2() %>',
}, {
  from: { name: 't2' },
  to: [{ name: 't3' }],
  condition: '<% some_condition_3() %>',
}, {
  from: { name: 't3' },
  to: [{ name: 't4' }],
  condition: null,
}];

const mistral = {
  Model: MistralModel,
  versionMatch: '1.0',
  yaml: `
version: '1.0'
name: ${name}

my.workflow:
  description: ${description}
  tasks: ${tasks.map(t => `
    # [${t.coords.x}, ${t.coords.y}]
    ${t.name}:
      action: ${t.action}
      input: ${Object.keys(t.input).map(k => `
        ${k}: ${t.input[k]}
      `).join('')}
      ${transitions.filter(tr => tr.from.name === t.name).map((tr, i) => `
      ${i === 0 ? 'on-complete:' : ''}${tr.to.map(to => `
        - ${to.name}${tr.condition ? `: ${tr.condition}` : ''}
      `)}`).join('')}
    # END ${t.name}
  `).join('')}`,
};

const orquesta = {
  Model: OruestaModel,
  versionMatch: 2,
  yaml: `
version: 2.0
name: ${name}
description: ${description}

tasks: ${tasks.map(t => `
  # [${t.coords.x}, ${t.coords.y}]
  ${t.name}:
    action: ${t.action}
    input: ${Object.keys(t.input).map(k => `
      ${k}: ${t.input[k]}
    `).join('')}
    ${transitions.filter(tr => tr.from.name === t.name).map((tr, i) => `
    ${i === 0 ? 'next:' : ''}${tr.to.map(to => `
      - do: ${to.name}${tr.condition ? `
        when: ${tr.condition}` : ''}
    `)}`).join('')}
  # END ${t.name}
  `).join('')}`,
};


export {
  tasks,
  transitions,
  mistral,
  orquesta,
};
