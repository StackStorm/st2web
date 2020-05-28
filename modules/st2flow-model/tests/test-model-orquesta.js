// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

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
