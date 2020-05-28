// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

import { expect } from 'chai';
import fs from 'fs';
import path from 'path';

import Model from '../model-mistral';

describe('st2flow-model: Mistral Model', () => {
  let raw = null;
  let model = null;

  describe('basic.yaml', () => {
    before(() => {
      raw = fs.readFileSync(path.join(__dirname, 'data', 'mistral-basic.yaml'), 'utf-8');
    });

    beforeEach(() => {
      model = new Model(raw);
      expect(model).to.have.property('tokenSet');
    });

    describe('updateTransition()', () => {
      it('can update the transition type', () => {
        const origTr = model.transitions[0];
        expect(origTr).to.have.property('type', 'Success');

        model.updateTransition(origTr, {
          type: 'Complete',
        });

        const oldTransition = model.transitions.find(tr =>
          tr.type === origTr.type && tr.from.name === origTr.from.name && tr.to.name === origTr.to.name && tr.condition === origTr.condition
        );
        const newTransition = model.transitions.find(tr =>
          tr.type === 'Complete' && tr.from.name === origTr.from.name && tr.to.name === origTr.to.name && tr.condition === origTr.condition
        );

        expect(oldTransition).to.equal(undefined);
        expect(newTransition).to.not.equal(undefined);
      });
    });
  });
});
