// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

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
