// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

import { expect } from 'chai';
import fs from 'fs';
import path from 'path';

import Model from '../model-meta';

describe('st2flow-model: Meta Model', () => {
  const raw = fs.readFileSync(path.join(__dirname, 'data', 'meta-basic.json'), 'utf-8');
  let model = null;

  describe('handles meta-basic.json', () => {

    beforeEach(() => {
      model = new Model(raw);
    });

    it('reads metadata', () => {
      expect(model.get('runner_type')).to.equal('python-script');
      expect(model.get('description')).to.equal('Format a Python list into a CSV string');
    });

    it('reads parameters', () => {
      const parameters = model.get('parameters');
      expect(Object.keys(parameters)).to.have.property('length', 8);

      for (const [ , value ] of Object.entries(parameters)) {
        expect(value).to.have.property('type');
        expect(value).to.have.property('description');
      }
    });

    it('writes meta-basic.json', () => {
      expect(model.toYAML()).to.equal(raw);
    });

    it('updates metadata', () => {
      model.set('runner_type', 'some');

      expect(model.get('runner_type')).to.equal('some');
    });
  });

});
