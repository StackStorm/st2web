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

import fs from 'fs';
import path from 'path';
import { expect } from 'chai';
import TokenSet from '../token-set';
import crawler from '../crawler';

describe('TokenSet', () => {
  [ 'basic', 'simple', 'long', 'complex' ].forEach(file => {
    let yaml;
    let set;

    describe('Conventional YAML', () => {
      const filename = `${file}.yaml`;

      before(() => {
        yaml = fs.readFileSync(path.join(__dirname, 'data', filename), 'utf-8');
      });

      beforeEach(() => {
        set = new TokenSet(yaml);
      });

      it(`stringification maintains source identity with ${filename}`, () => {
        expect(set.toYAML()).to.equal(yaml);
      });

      it(`refining maintains source identity with ${filename}`, () => {
        set.refineTree();
        expect(set.toYAML()).to.equal(yaml);
      });
    });

    describe('JSON-like YAML', () => {
      const filename = `${file}-json.yaml`;

      before(() => {
        yaml = fs.readFileSync(path.join(__dirname, 'data', filename), 'utf-8');
      });

      beforeEach(() => {
        set = new TokenSet(yaml);
      });

      it(`stringification maintains source identity with ${filename}`, () => {
        expect(set.toYAML()).to.equal(yaml);
      });

      it(`refining maintains source identity with ${filename}`, () => {
        set.refineTree();
        expect(set.toYAML()).to.equal(yaml);
      });
    });
  });

  describe('Special cases', () => {
    it('set a key inside an empty mapping', () => {
      const set = new TokenSet('tasks: {}\n');
      crawler.set(set, 'tasks', { some: 'thing' });

      expect(set.toYAML()).to.equal('tasks:\n  some: thing\n');
    });
  });
});
