// Copyright 2021 The StackStorm Authors.
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

// @flow

import type { JPath, TokenRawValue, TokenKeyValue, TokenMapping, TokenCollection, TokenReference, ValueToken, AnyToken, Refinement } from './types';

import { deepClone } from './util';
import crawler from './crawler';
import factory from './token-factory';
import stringifier from './stringifier';

const STR_COLON = ':';
const STR_DASH = '-';
const STR_COMMA = ',';
const STR_OPEN_CURLY = '{';
const STR_CLOSE_CURLY = '}';
const STR_OPEN_SQUARE = '[';
const STR_CLOSE_SQUARE = ']';
const STR_FIRST_TOKEN = 'mappings.0';
const REG_LEADING_SPACE = /^\s+/;
const REG_ALL_WHITESPACE = /^\s*$/;
const REG_JSON_START = /^\s*(?:[-:] )?[{[]/;
const REG_SPECIAL = /^\s*[-:?]\s*/;
const REG_COMMA = /^\s*(?::\s*[{[]\s*)?[}\]]?\s*,\s*/;

const EMPTY_TREE = Object.assign({}, factory.baseToken, {
  kind: 2,
  mappings: [],
  range: [{ row: 0, column: 0 }, { row: 0, column: 0 }],
});

/**
 * Class for refining tokens whenever mutations are made to the AST.
 */
class Refinery {
  oldYaml: string = '';
  newYaml: string = '';
  indent: string;
  tree: TokenMapping;

  // used to determine whether or not we are refining JSON data
  isJSON: boolean = false;

  constructor(tree: TokenMapping, indent: string, oldYaml: string = '') {
    if(tree.kind !== 2) {
      throw new Error('Tree argument must be a mapping token');
    }

    this.tree = tree;
    this.indent = indent;
    this.oldYaml = oldYaml;
  }

  // This is the only method anybody should care about
  refineTree(): Refinement {
    const newTree: AnyToken = this.prefixToken(this.tree, 0, this.tree.jpath || []);

    if(newTree.kind !== 2 ) {
      return {
        tree: deepClone(EMPTY_TREE),
        yaml: '',
      };
    }

    const firstToken: ?TokenRawValue | ?TokenReference = crawler.findFirstValueToken(newTree);
    const startPos: number = firstToken ? firstToken.prefix.reduce((pos, prefix) => pos + prefix.rawValue.length, 0) : 0;
    this.reIndexToken(newTree, startPos);

    return {
      tree: newTree,
      yaml: this.newYaml,
    };
  }

  /**
   * Given a token, refines the token
   */
  prefixToken(startToken: AnyToken, depth: number, jpath: JPath): AnyToken {
    startToken.jpath = jpath;

    switch(startToken.kind) {
      case 0:
      case 4:
        return startToken;

      case 1:
        this.prefixKey(startToken.key, depth, jpath);

        if(startToken.value !== null && typeof startToken.value !== 'undefined') {
          this.prefixValue(startToken.value, depth, jpath);
        }

        return startToken;

      case 2:
        this.prefixMapping(startToken, depth, jpath);
        return startToken;

      case 3:
        this.prefixCollection(startToken, depth, jpath);
        return startToken;

      default:
        throw new Error(`Unknown token kind: ${startToken.kind}`);
    }
  }

  /**
   * Adds the prefix to "key" tokens in a mapping. This is mostly whitespace.
   */
  prefixKey(token: TokenRawValue | TokenCollection, depth: number, jpath: JPath): void {
    this.prefixToken(token, depth + 1, jpath.concat('key'));

    if(jpath.join('.') === STR_FIRST_TOKEN) {
      return;
    }

    const rawToken: ?TokenRawValue | ?TokenReference = crawler.findFirstValueToken(token);
    if(!rawToken) {
      return;
    }

    if(!rawToken.prefix) {
      rawToken.prefix = [];
    }

    const { prefix, jpath: tokenPath } = rawToken;


    // TODO: smarter indentation detection per token
    // (using depth and leading whitespace in prefix)
    let indent = `\n${this.indent.repeat(depth)}`;

    if(this.isJSON) {
      // JSON-like data
      const isFirstKey = tokenPath[tokenPath.length - 2] === 0;
      const hasJsonStart = isFirstKey && prefix.some(t => REG_JSON_START.test(t.value));
      const commaIndex = prefix.findIndex(t => REG_COMMA.test(t.value));

      if(commaIndex === 0) {
        prefix[0].value = prefix[0].rawValue = prefix[0].rawValue.replace(REG_LEADING_SPACE, '');
      }

      if(!isFirstKey && commaIndex === -1) {
        prefix.push(factory.createRawValueToken(STR_COMMA));

        if(!hasJsonStart) {
          prefix.push(factory.createRawValueToken(`${indent}`));
        }
      }

    }
    else {
      // Normal YAML

      // Collections have loose indentation semantics, and we want to preserve
      // any existing indentation, determined by the first item in the list.
      // First determine if the current mapping is in a list. Since we are
      // currently processing a mapping "key", the end of the jpath will
      // always match this pattern: [..., 'items', 0, 'mappings', 0, 'key'].
      const isInCollection = tokenPath.length > 4 && tokenPath[tokenPath.length - 5] === 'items';
      if(isInCollection) {
        const firstToken = crawler.findFirstValueToken(token);

        if(firstToken && firstToken.prefix.length) {
          const lastPrefix = firstToken.prefix[firstToken.prefix.length - 1];
          const match = lastPrefix.rawValue.match(REG_LEADING_SPACE);

          if(match) {
            indent = match[0];
          }
        }
      }

      prefix.forEach((t, i) => {
        if(!REG_ALL_WHITESPACE.test(t.rawValue) && !REG_SPECIAL.test(t.rawValue) && !t.rawValue.includes(indent)) {
          if(i > 0 || !REG_LEADING_SPACE.test(t.rawValue)) {
            t.value = t.rawValue = `${indent}${t.rawValue.replace(REG_LEADING_SPACE, '')}`;
          }
        }
      });

      const lastVal = prefix.length && prefix[prefix.length - 1].rawValue;
      if(!prefix.length || (lastVal && !REG_SPECIAL.test(lastVal) && lastVal !== indent)) {
        prefix.push(factory.createRawValueToken(`${indent}`));
      }
    }
  }

  /**
   * Adds the prefix to "value" tokens in a mapping. Most of the time
   * this will consist of a colon and white space.
   */
  prefixValue(token: ValueToken, depth: number, jpath: JPath): void {
    this.prefixToken(token, depth + 1, jpath.concat('value'));

    const rawToken: ?TokenRawValue | ?TokenReference = crawler.findFirstValueToken(token);

    if(!rawToken) {
      return;
    }

    if(!rawToken.prefix) {
      rawToken.prefix = [];
    }

    this.addColonPrefix(rawToken.prefix);
  }

  /**
   * Given a prefix collection, adds the color if it does not exist
   */
  addColonPrefix(prefix: Array<TokenRawValue>) {
    if(prefix.every(t => t.value.indexOf(STR_COLON) === -1)) {
      let colon = STR_COLON;

      if(!prefix.length || !/^\n/.test(prefix[prefix.length - 1].rawValue)) {
        colon += ' ';
      }

      prefix.unshift(factory.createRawValueToken(colon));
    }
  }

  /**
   * Given a TokenMapping (kind: 2), refines each token in the mappings array.
   */
  prefixMapping(startToken: TokenMapping, depth: number, jpath: JPath) {
    let isJSON: boolean = false;
    let firstToken: TokenRawValue | TokenReference;
    let mapNeedsClosing: boolean = false;

    startToken.mappings.forEach((token: TokenKeyValue, i: number) => {
      if (token === null) {
        return;
      }

      const rawToken: ?TokenRawValue | ?TokenReference = crawler.findFirstValueToken(token);

      if(!rawToken) {
        return;
      }

      if(!rawToken.prefix) {
        rawToken.prefix = [];
      }

      if(!firstToken) {
        firstToken = rawToken;

        if(this.isJSON) {
          if(firstToken.prefix.every(t => !REG_JSON_START.test(t.value))) {
            firstToken.prefix.unshift(factory.createRawValueToken(`${STR_OPEN_CURLY}\n${this.indent.repeat(depth)}`));
            mapNeedsClosing = true;
          }
        }
        else if(firstToken.prefix.find(t => REG_JSON_START.test(t.value))) {
          // The object is a JSON-style object -> { foo: bar }
          isJSON = this.isJSON = true;
        }
      }

      this.prefixToken(token, depth, jpath.concat('mappings', i));
    });

    if(this.isJSON && mapNeedsClosing) {
      if(!startToken.suffix) {
        startToken.suffix = [];
      }
      startToken.suffix.unshift(factory.createRawValueToken(`\n${this.indent.repeat(depth - 1)}${STR_CLOSE_CURLY}`));
    }

    // reset it back
    if(isJSON) {
      this.isJSON = false;
    }
  }

  /**
   * Given a TokenCollection (kind: 3), refines each token in the items array.
   */
  prefixCollection(startToken: TokenCollection, depth: number, jpath: JPath) {
    let isJSON: boolean = false;
    let firstToken: TokenRawValue | TokenReference;
    let itemsNeedsClosing: boolean = false;

    startToken.items.forEach((token, i) => {
      if(token === null) {
        return;
      }

      this.prefixToken(token, depth + 1, jpath.concat('items', i));

      const rawToken: ?TokenRawValue | ?TokenReference = crawler.findFirstValueToken(token);

      if(!rawToken) {
        return;
      }

      if(!rawToken.prefix) {
        rawToken.prefix = [];
      }

      if(!firstToken) {
        firstToken = rawToken;

        if(this.isJSON) {
          if(firstToken.prefix.every(t => !REG_JSON_START.test(t.value))) {
            firstToken.prefix.unshift(factory.createRawValueToken(`${STR_OPEN_SQUARE}\n${this.indent.repeat(depth)}`));
            itemsNeedsClosing = true;
          }
        }
        else if(firstToken.prefix.find(t => REG_JSON_START.test(t.value))) {
          // The object is a JSON-style array -> foo: [ bar ]
          isJSON = this.isJSON = true;
        }
      }

      let delimeterIndex: number = rawToken.prefix.findIndex(t =>
        this.isJSON
          ? REG_JSON_START.test(t.value) || REG_COMMA.test(t.value)
          : t.value.indexOf(STR_DASH) !== -1
      );

      // if it's already there, no need to go further
      if(delimeterIndex !== -1) {
        return;
      }

      // First remove any whitespace tokens at the top of the prefix
      let pre = rawToken.prefix[ ++delimeterIndex ] ;  // eslint-disable-line no-plusplus
      while(pre && REG_ALL_WHITESPACE.test(pre.rawValue)) {
        rawToken.prefix.splice(delimeterIndex, 1);
        pre = rawToken.prefix[ delimeterIndex ];
      }

      /**
       * For every instance of ["items", \d] near the top of the jpath,
       * add an indent + dash. So for values nested 3 levels deep like this:
       *   foo: [ [ [ 'bar' ] ] ]
       * the jpath for "bar" will look something like this:
       *   ['mappings', 0, 'value', 'items', 0, 'items', 0, 'items', 0]
       * For object values values nested 3 levels deep like this:
       *   foo: [ [ [ { bing: 'bar' } ] ] ]
       * the jpath for "bing" will look something like this:
       *   ['mappings', 0, 'value', 'items', 0, 'items', 0, 'items', 0, 'mappings', 0, 'key']
       */
      let nesting = 0;
      let itemsIdx = rawToken.jpath.lastIndexOf('items');
      let lastTwo = rawToken.jpath.slice(itemsIdx, itemsIdx + 2);
      let currentIndex = parseInt(lastTwo[1], 10);
      const firstIndex = currentIndex;

      while(lastTwo[0] === 'items' && !isNaN(currentIndex) && currentIndex >= firstIndex) {
        let separator: string = '';
        let prefix: string;

        if(this.isJSON) {
          if(currentIndex > 0) {
            separator = nesting === 0 ? `${STR_COMMA} ` : STR_COMMA;
          }

          prefix = `${separator}\n${this.indent.repeat(depth - nesting)}`;
        }
        else {
          separator = nesting === 0 ? `${STR_DASH} ` : STR_DASH;
          prefix = `\n${this.indent.repeat(depth - nesting)}${separator}`;
        }

        rawToken.prefix.unshift(factory.createRawValueToken(prefix));

        if(++nesting > 0 && firstIndex > 0) {  // eslint-disable-line no-plusplus
          break;
        }

        itemsIdx -= 2;
        lastTwo = rawToken.jpath.slice(itemsIdx, itemsIdx + 2);
        currentIndex = parseInt(lastTwo[1], 10);
      }

      // the first item in a collection should have a colon prefix
      if(i === 0 && rawToken.jpath[itemsIdx + 3] === 0) {
        this.addColonPrefix(rawToken.prefix);
      }
    });

    if(this.isJSON && itemsNeedsClosing) {
      if(!startToken.suffix) {
        startToken.suffix = [];
      }

      startToken.suffix.unshift(factory.createRawValueToken(`\n${this.indent.repeat(depth - 1)}${STR_CLOSE_SQUARE}`));
    }

    // reset it back
    if(isJSON) {
      this.isJSON = false;
    }
  }

  reIndexToken(token: AnyToken, startPos: number): number {
    if(token === null) {
      return startPos;
    }

    switch(token.kind) {
      case 0:
        token.startPosition = token.prefix.reduce((pos, prefix) => {
          return pos + prefix.rawValue.length;
        }, startPos);
        token.endPosition = token.startPosition + (token.rawValue || token.value).length;
        this.newYaml += stringifier.stringifyToken(token);
        factory.addRangeInfo(token, this.newYaml);
        break;

      case 1:
        token.startPosition = startPos;
        startPos = this.reIndexToken(token.key, token.startPosition);
        token.endPosition = token.value ? this.reIndexToken(token.value, startPos) : startPos;
        factory.addRangeInfo(token, this.newYaml);
        break;

      case 2:
        token.startPosition = startPos;
        token.endPosition = token.mappings.reduce((pos, t) => {
          return this.reIndexToken(t, pos);
        }, startPos);

        if(token.suffix) {
          this.newYaml += token.suffix.reduce((s, t) => stringifier.stringifyToken(t, s), '');
        }

        factory.addRangeInfo(token, this.newYaml);
        break;

      case 3:
        token.startPosition = startPos;
        token.endPosition = token.items.reduce((pos, t) => {
          return this.reIndexToken(t, pos);
        }, startPos);

        if(token.suffix) {
          this.newYaml += token.suffix.reduce((s, t) => stringifier.stringifyToken(t, s), '');
        }

        factory.addRangeInfo(token, this.newYaml);
        break;

      case 4:
        token.startPosition = token.prefix.reduce((pos, prefix) => {
          return pos + prefix.rawValue.length;
        }, startPos);
        this.newYaml += stringifier.stringifyToken(token);
        token.endPosition = token.startPosition + token.referencesAnchor.length + 1;
        factory.addRangeInfo(token, this.newYaml);
        break;

      default:
        throw new Error(`Unknown token kind: ${token.kind}`);
    }

    return token.endPosition;
  }
}

export default Refinery;
