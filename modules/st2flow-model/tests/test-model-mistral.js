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
