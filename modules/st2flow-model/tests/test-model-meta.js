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
