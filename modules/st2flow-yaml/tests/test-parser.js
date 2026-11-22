// Copyright 2026 The StackStorm Authors.
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

import { load } from '../parser';

// The positions below are the conventions of yaml-ast-parser, which this parser replaced; the
// token set reconstructs comments and whitespace from the gaps between them.
const pair = (root, key) => root.mappings.find(m => m.key.value === key);
const span = (text, node) => text.slice(node.startPosition, node.endPosition);

describe('st2flow-yaml parser', () => {
  describe('node shape and positions', () => {
    const text = [
      '---',
      'version: 1.0',
      '# comment',
      'description: "quoted: value"',
      'input:',
      '  - a',
      '  - b: 2',
      '    c: \'single\'',
      '',
      '# trailing comment',
      'vars: &anchor',
      '  x: yes',
      'ref: *anchor',
      'flow: { a: 1, b: [ 1, 2 ] }',
      'nil:',
      'block: |',
      '  line1',
      '  line2',
      '',
      'tagged: !!str 123',
      '',
    ].join('\n');
    const root = load(text);

    it('starts the root mapping at its first key and ends it with the input', () => {
      expect(root.kind).to.equal(2);
      expect(root.errors).to.deep.equal([]);
      expect(root.startPosition).to.equal(text.indexOf('version'));
      expect(root.endPosition).to.equal(text.length);
    });

    it('describes scalars by quoting style', () => {
      const version = pair(root, 'version');
      expect(version).to.include({ kind: 1, startPosition: version.key.startPosition, endPosition: version.value.endPosition });
      expect(version.value).to.include({ kind: 0, value: '1.0', valueObject: 1, plainScalar: true, doubleQuoted: false });

      const description = pair(root, 'description').value;
      expect(description).to.include({ value: 'quoted: value', doubleQuoted: true });
      expect(description).to.not.have.property('plainScalar');
      expect(span(text, description)).to.equal('"quoted: value"');

      const c = pair(pair(root, 'input').value.items[1], 'c').value;
      expect(c).to.include({ value: 'single', singleQuoted: true, doubleQuoted: false });
    });

    it('runs a block sequence on to the next token, over blank lines and comments', () => {
      const input = pair(root, 'input').value;
      expect(input.kind).to.equal(3);
      expect(input.items.map(i => i.kind)).to.deep.equal([ 0, 2 ]);
      expect(input.endPosition).to.equal(text.indexOf('vars:'));
      // a block mapping ends with its last value
      expect(span(text, input.items[1])).to.equal('b: 2\n    c: \'single\'');
    });

    it('records anchors and aliases', () => {
      const vars = pair(root, 'vars').value;
      expect(vars.anchorId).to.equal('anchor');
      expect(span(text, vars)).to.equal('x: yes');
      // "yes" is left to the token set, as before
      expect(pair(vars, 'x').value).to.not.have.property('valueObject');

      const ref = pair(root, 'ref').value;
      expect(ref).to.include({ kind: 4, referencesAnchor: 'anchor' });
      expect(ref.value).to.equal(vars);
      expect(span(text, ref)).to.equal('anchor');
    });

    it('spans flow collections up to their closing bracket', () => {
      const flow = pair(root, 'flow').value;
      expect(span(text, flow)).to.equal('{ a: 1, b: [ 1, 2 ] }');
      expect(span(text, pair(flow, 'b').value)).to.equal('[ 1, 2 ]');
    });

    it('ends a pair without a value after its colon', () => {
      const nil = pair(root, 'nil');
      expect(nil.value).to.equal(null);
      expect(span(text, nil)).to.equal('nil:');
    });

    it('ends a block scalar at the last line break before the next token', () => {
      const block = pair(root, 'block').value;
      expect(block.value).to.equal('line1\nline2\n');
      expect(span(text, block)).to.equal('|\n  line1\n  line2\n');
      expect(block).to.not.have.property('plainScalar');
    });

    it('starts a tagged scalar after its tag and leaves it untyped', () => {
      const tagged = pair(root, 'tagged').value;
      expect(span(text, tagged)).to.equal('123');
      expect(tagged).to.not.have.property('valueObject');
    });

    it('treats input without a final line break as if it had one', () => {
      const noBreak = 'a:\n  - 1\n  - 2';
      const seq = load(noBreak).mappings[0].value;
      expect(seq.endPosition).to.equal(noBreak.length + 1);
      expect(load(noBreak).endPosition).to.equal(noBreak.length);
    });

    it('returns null for an empty document', () => {
      expect(load('')).to.equal(null);
      expect(load('# just a comment\n')).to.equal(null);
    });
  });

  describe('implicit typing of plain scalars (js-yaml 3 rules)', () => {
    const typed = (value) => {
      const node = load(`k: ${value}\n`).mappings[0].value;
      return Object.hasOwn(node, 'valueObject') ? node.valueObject : 'string';
    };

    it('types nulls and booleans', () => {
      for (const v of [ '~', 'null', 'Null', 'NULL' ]) {
        expect(typed(v), v).to.equal(null);
      }
      for (const v of [ 'true', 'True', 'TRUE' ]) {
        expect(typed(v), v).to.equal(true);
      }
      for (const v of [ 'false', 'False', 'FALSE' ]) {
        expect(typed(v), v).to.equal(false);
      }
      // YAML 1.1 booleans stay strings here; the token set handles them
      for (const v of [ 'yes', 'no', 'on', 'off', 'y', 'n' ]) {
        expect(typed(v), v).to.equal('string');
      }
    });

    it('types integers in all of js-yaml\'s forms', () => {
      const cases = { '0': 0, '-12': -12, '+12': 12, '0x1F': 31, '017': 15, '0b101': 5, '1_000': 1000, '1:20': 80, '-0': 0, '_1': 1 };
      for (const [ v, expected ] of Object.entries(cases)) {
        expect(typed(v), v).to.equal(expected);
      }
      for (const v of [ '0o17', '1,000', '12abc', '08', '0b', '1:60' ]) {
        expect(typed(v), v).to.equal('string');
      }
    });

    it('types floats only when they have a "."', () => {
      expect(typed('1.5e-3')).to.equal(0.0015);
      expect(typed('.5')).to.equal(0.5);
      expect(typed('5.')).to.equal(5);
      expect(typed('0.1_2')).to.equal(0.12);
      expect(typed('1:30.5')).to.equal(90.5);
      expect(typed('.inf')).to.equal(Infinity);
      expect(typed('-.Inf')).to.equal(-Infinity);
      expect(typed('.NaN')).to.be.NaN;
      expect(typed('1e3')).to.equal('string');
    });

    it('types timestamps as dates', () => {
      expect(typed('2001-12-14').toISOString()).to.equal('2001-12-14T00:00:00.000Z');
      expect(typed('2001-12-14t21:59:43.10-05:00').toISOString()).to.equal('2001-12-15T02:59:43.100Z');
      expect(typed('2001-12-14 21:59:43.10 +01:30').toISOString()).to.equal('2001-12-14T20:29:43.100Z');
    });

    it('never types quoted or block scalars', () => {
      expect(typed('"5"')).to.equal('string');
      expect(typed('\'true\'')).to.equal('string');
      expect(load('k: |\n  5\n').mappings[0].value).to.not.have.property('valueObject');
    });
  });

  describe('values the previous parser got wrong', () => {
    it('keeps an escaped single quote that ends a line', () => {
      const value = load('k: \'say \'\'hi\'\'\n  there\'\n').mappings[0].value.value;
      expect(value).to.equal('say \'hi\' there');
    });

    it('keeps a leading blank line in a literal block', () => {
      expect(load('k: |\n\n  text\n').mappings[0].value.value).to.equal('\ntext\n');
    });
  });

  describe('errors', () => {
    it('collects parse errors on the root with a 0-based mark', () => {
      const root = load('a: [1, 2\nb: c\n');
      expect(root.errors).to.not.be.empty;

      const [ error ] = root.errors;
      expect(error.name).to.equal('YAMLException');
      expect(error.message).to.match(/^YAML Parser: .+ at line \d+, column \d+$/);
      expect(error.mark).to.have.all.keys('line', 'column', 'position');
    });

    it('reports a mark on the first line as line 0', () => {
      const [ error ] = load('a: b: c\n').errors;
      expect(error.mark).to.include({ line: 0, column: 3 });
    });

    it('rejects duplicate keys', () => {
      const [ error ] = load('a: 1\na: 2\n').errors;
      expect(error.reason).to.match(/unique/i);
    });
  });
});
