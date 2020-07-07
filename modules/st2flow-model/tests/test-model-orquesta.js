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

import { expect } from 'chai';
import fs from 'fs';
import path from 'path';

import diff from 'deep-diff';
import Model from '../model-orquesta';

describe('st2flow-model: Orquesta Model', () => {
  let raw = null;
  let model = null;

  describe('basic.yaml', () => {
    before(() => {
      raw = fs.readFileSync(path.join(__dirname, 'data', 'orquesta-basic.yaml'), 'utf-8');
    });

    beforeEach(() => {
      model = new Model(raw);
      expect(model).to.have.property('tokenSet');
    });

    describe('updateTransition()', () => {
      it('removes "do" values', () => {
        const origTr = model.transitions[0];
        expect(model.transitions.length).to.equal(4);

        model.updateTransition(model.transitions[0], {
          to: [],
        });

        expect(model.transitions.length).to.equal(4);
        const oldTransition = model.transitions.find(tr =>
          tr.from.name === origTr.from.name && !diff(tr.to, origTr.to) && tr.condition === origTr.condition
        );

        expect(oldTransition).to.equal(undefined);
      });

      it('can update the transition publish values', () => {
        const origTr = model.transitions[0];
        const data = {
          publish: [{ foo: '<% bar() %>' }],
        };

        model.updateTransition(origTr, data);

        const newTr = Object.assign({}, origTr, data);
        const oldTransition = model.transitions.find(tr => !diff(tr, origTr));
        const newTransition = model.transitions.find(tr => !diff(tr, newTr));

        expect(oldTransition).to.equal(undefined);
        expect(newTransition).to.not.equal(undefined);
      });
    });

    describe('updates YAML', () => {
      it('for task deletions', () => {
        const lines = raw.split('\n');

        model.deleteTask(model.tasks[1]);
        lines.splice(18, 1);
        lines.splice(25, 2);

        expect(model.toYAML()).to.equal(lines.join('\n'));
      });

      it('for transition deletions', () => {
        const lines = raw.split('\n');
        model.deleteTransition(model.transitions[3]);
        lines.splice(30, 2);

        model.deleteTransition(model.transitions[0]);
        lines.splice(15, 5);

        expect(model.toYAML()).to.equal(lines.join('\n'));
      });
    });
  });
});
