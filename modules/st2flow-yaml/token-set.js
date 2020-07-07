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

import type { JPath, TokenRawValue, TokenKeyValue, TokenMapping, TokenCollection, TokenReference, ValueToken } from './types';
import { load } from 'yaml-ast-parser';
import { pick, omit, get } from './util';
import Objectifier from './objectifier';
import stringifier from './stringifier';
import Refinery from './token-refinery';
import factory from './token-factory';
import perf from '@stackstorm/st2flow-perf';

const REG_CARRIAGE = /\r/g;
const REG_NEWLINE = /\n/;
const REG_TAG = /:\s+!!?[\w]*\s?/;
const REG_BOOL_TRUE = /^(?:y(?:es)?|on)$/i; // y yes on
const REG_BOOL_FALSE = /^(?:no?|off)$/i; // n no off
const REG_FORMATTED_NUMBER = /^[+-]?[\d,_]*(?:\.[\d]*)?(?:e[+-]?\d+)?$/;
const REG_JSON_END = /^[^#}\]]*[}\]]/;
const REG_INDENT = /\n( +)\S/;
const OMIT_FIELDS = [ 'errors', 'parent', 'mappings', 'items' ];
const DEFAULT_INDENT = '  ';

class TokenSet {
  yaml: string;                 // The full YAML file
  tree: TokenMapping;           // All of the parsed tokens
  lastToken: ValueToken;        // The last "value" token (kind: 0) that was processed
  anchors: Object;              // Map of anchor IDs to the original token
  indent: string;               // The indentation used
  objectified: ?Object;         // POJO representation of the token tree
  stringified: ?string;         // Stringified YAML

  // After parsing the node tree, certain mapping and collection tokens
  // will need a suffix. The suffix is only used to close JS-like data
  // within YAML (closing curly and square braces).
  tokensWithSuffix: Map<JPath, Array<TokenRawValue>> = new Map();

  constructor(yaml: string) {
    this.parseYAML(yaml);
  }

  parseYAML(yaml: string) {
    perf.start('parseYAML');

    this.yaml = yaml.replace(REG_CARRIAGE, '');

    const rootNode = load(this.yaml);
    if (!rootNode || rootNode.kind !== 2) {
      // YAML can be a simple scalar (kind: 0), mapping (kind: 2), or collection (kind: 3).
      // However, we demand all YAML files to be a mapping
      throw new Error(`Invalid root node kind (${rootNode && rootNode.kind}) - must be a mapping`);
    }

    const match = this.yaml.match(REG_INDENT);

    this.indent = match && match[1] || DEFAULT_INDENT;
    this.anchors = {};
    this.objectified = null;
    this.stringified = null;
    this.tree = this.parseMappingNode(rootNode);

    const tail = tokenizeUnparsedData(this.yaml.slice(this.lastToken.endPosition), this.lastToken, this.tokensWithSuffix);

    this.tokensWithSuffix.forEach((tokens, jpath) => {
      const token = get(this.tree, jpath);
      token.suffix = tokens;
    });

    this.tree.suffix = (this.tree.suffix || []).concat(tail);

    perf.stop('parseYAML');
    // console.log(JSON.stringify(this.tree, null, '  '));
  }

  parseNode(node: Object, jpath: JPath = []): ?ValueToken {
    if(node === null || typeof node === 'undefined') {
      return null;
    }

    this.checkNodeErrors(node);

    switch(node.kind) {
      case 0: // scalar "value" token (no children)
        return this.parseValueNode(node, jpath);

      case 1: // key/value pair
        this.parseKeyValueNode(node, jpath);
        return null;

      case 2: // map (key value pairs)
        return this.parseMappingNode(node, jpath);

      case 3: // collection
        return this.parseCollectionNode(node, jpath);

      case 4: // reference
        return this.parseReferenceNode(node, jpath);

      default:
        throw new Error(`Unexpected node kind ${node.kind} at ${jpath.join('.')}`);
    }
  }

  checkNodeErrors(node: Object) {
    if(node && node.errors && node.errors.length) {
      throw node.errors;
    }
  }

  // kind: 0
  parseValueNode(node: Object, jpath: JPath = []): TokenRawValue {
    this.checkNodeErrors(node);

    const token: TokenRawValue = omit(node, ...OMIT_FIELDS);
    token.jpath = jpath;
    token.prefix = this.parsePrefix(token);
    token.rawValue = this.yaml.slice(token.startPosition, token.endPosition);

    // Don't parse mapping keys for special values.
    // This MUST happen after parsePrefix
    const len = jpath.length;
    const isKey = len > 2 && jpath[len - 1] === 'key' && jpath[len - 3] === 'mappings';
    if (!isKey) {
      const special = parseSpecialValue(token);
      if (special !== undefined) {
        token.valueObject = special;
      }
    }

    if(token.anchorId) {
      this.anchors[token.anchorId] = token;
    }

    factory.addRangeInfo(token, this.yaml);

    return token;
  }

  // kind: 1
  parseKeyValueNode(node: Object, jpath: JPath = []): TokenKeyValue {
    this.checkNodeErrors(node.key);
    this.checkNodeErrors(node.value);

    // Keys are normally scalar keys (foo: bar) but can an array
    // See test files for examples of multiline keys.
    if(node.key.kind !== 0 && node.key.kind !== 3) {
      throw new Error(`Unexpected node key kind: ${node.key.kind}`);
    }

    const token: TokenKeyValue = pick(node, 'kind', 'startPosition', 'endPosition');
    token.jpath = jpath;

    if(node.key.kind === 0) {
      token.key = this.parseValueNode(node.key, jpath.concat('key'));
    }
    else {
      token.key = this.parseCollectionNode(node.key, jpath.concat('key'));
    }

    token.value = this.parseNode(node.value, jpath.concat('value'));

    factory.addRangeInfo(token, this.yaml);

    return token;
  }

  // kind: 2
  parseMappingNode(node: Object, jpath: JPath = []): TokenMapping {
    this.checkNodeErrors(node);

    const token: TokenMapping = omit(node, ...OMIT_FIELDS);
    token.jpath = jpath;

    if(token.anchorId) {
      this.anchors[token.anchorId] = token;
    }

    token.mappings = node.mappings.map((kvPair, i) =>
      this.parseKeyValueNode(kvPair, jpath.concat('mappings', i))
    );

    if(!token.mappings.length) {
      // special handling for empty JS objects
      const suffix = this.yaml.slice(this.lastToken.endPosition, token.endPosition);
      token.suffix = [ createToken(suffix, this.lastToken.endPosition) ];
      this.lastToken = token;
    }

    factory.addRangeInfo(token, this.yaml);

    return token;
  }

  // kind: 3
  parseCollectionNode(node: Object, jpath: JPath = []): TokenCollection {
    this.checkNodeErrors(node.key);

    const token: TokenCollection = omit(node, ...OMIT_FIELDS);
    token.jpath = jpath;

    token.items = node.items.map((item, i) => {
      return this.parseNode(item, jpath.concat('items', i));
    });

    if(!token.items.length) {
      // special handling for empty JS arrays
      const suffix = this.yaml.slice(this.lastToken.endPosition, token.endPosition);
      token.suffix = [ createToken(suffix, this.lastToken.endPosition) ];
      this.lastToken = token;
    }

    factory.addRangeInfo(token, this.yaml);

    return token;
  }

  // kind: 4
  parseReferenceNode(node: Object, jpath: JPath = []): TokenReference {
    this.checkNodeErrors(node.key);

    const token: TokenReference = omit(node, 'value', ...OMIT_FIELDS);
    token.jpath = jpath;
    token.prefix = this.parsePrefix(token);
    token.value = omit(this.anchors[token.referencesAnchor], ...OMIT_FIELDS);

    factory.addRangeInfo(token, this.yaml);

    return token;
  }

  /**
   * Parses the space between the last token and the next one.
   * This includes whitespace, comments, colons, and other
   * characters which are not part of the token value.
   */
  parsePrefix(token: TokenRawValue | TokenReference): Array<TokenRawValue> {
    const prev = this.lastToken;
    const startIdx  = prev ? prev.endPosition : 0;
    const gap = this.yaml.slice(startIdx, token.startPosition);

    token.isTag = REG_TAG.test(gap);
    this.lastToken = token;

    return tokenizeUnparsedData(gap, prev, this.tokensWithSuffix);
  }

  /**
   * Should be called any time a mutation is made to the tree.
   * This will reindex all tokens, ensure proper jpaths and prefixes,
   * reset any internal caches, and otherwise *refresh* the state of
   * things after any mutations are made (see the crawler for usage).
   *
   * IMPORTANT: it is the responsibility of consumers to call this method
   * any time a mutation is made! In general, the crawler should be
   * the only thing that needs to call this method.
   */
  refineTree() {
    this.objectified = null;
    this.stringified = null;

    perf.start('refineTree');
    const refinery = new Refinery(this.tree, this.indent, this.yaml);
    const { tree, yaml } = refinery.refineTree();
    perf.stop('refineTree');

    this.tree = tree;
    this.yaml = this.stringified = yaml;
  }

  /**
   * Returns a POJO representation of the token tree. Most consumers
   * should work with the friendly object returned by this method. The
   * crawler is the "bridge" between this plain object and the AST and
   * should be used to make modifications to the AST.
   */
  toObject(): Object {
    if (!this.objectified) {
      perf.start('tree.toObject()');
      const objectifier = new Objectifier(this.anchors);
      this.objectified = objectifier.getTokenValue(this.tree);
      perf.stop('tree.toObject()');
    }

    return this.objectified || {};
  }

  /**
   * Contructs a YAML string from the token tree.
   */
  toYAML(): string {
    if(!this.stringified) {
      perf.start('tree.toYAML()');
      this.stringified = stringifier.stringifyToken(this.tree);
      perf.stop('tree.toYAML()');
    }

    return this.stringified || '';
  }
}

/**
 * Splits an unparsed string into tokens for every line.
 * If this detects the end of a JSON like object or array, then
 * those tokens get appended to the end of the corresponding
 * mapping or collection (respectively) in the form of a "suffix".
 *
 * For example, a string like this might exist:
 *
 * `
 *     ]},
 *   }
 * `
 *
 * Based on the above, there is a JSON array and two JSON objects
 * being closed. Those closing tokens are stored as a "suffix" on
 * corresponding collection or mapping. This is crucial for the
 * stringifier and token refinery as well as maintaining original
 * source identity.
 */
function tokenizeUnparsedData(str: string, lastToken: ValueToken, tokensWithSuffix): Array<TokenRawValue> {
  const lines = str.split(REG_NEWLINE);
  const tokens = [];
  let startPos = lastToken ? lastToken.endPosition : 0;
  let lastParentIndex = lastToken ? lastToken.jpath.length - 1 : 0;

  lines.forEach(line => {
    if(lastToken && REG_JSON_END.test(line)) {
      const matches = line.match(/[^#}\]]*[}\]]/g) || [];

      matches.forEach((match, n) => {
        const parentKey = match[match.length - 1] === '}' ? 'mappings' : 'items';
        lastParentIndex = lastToken.jpath.lastIndexOf(parentKey, lastParentIndex - 1);

        const parentJpath: JPath = lastToken.jpath.slice(0, lastParentIndex);
        const suffix: TokenRawValue = createToken(`${tokens.length && n === 0 ? '\n' : ''}${match}`, startPos);

        tokensWithSuffix.set(parentJpath, tokens.splice(0, tokens.length).concat(suffix));
        startPos = suffix.endPosition;
        line = line.replace(match, '');
      });
    }

    tokens.push(createToken(`${tokens.length === 0 ? '' : '\n'}${line}`, startPos));
  });

  // Ensure the first token doesn't start with a new line
  tokens[0].value = tokens[0].rawValue = tokens[0].value.replace(/^\n/, '');

  return tokens;
}

/**
 * Creates a token with start and end positions defined.
 */
function createToken(str: string, startPos: number): TokenRawValue {
  const token = factory.createRawValueToken(str);
  token.startPosition = startPos;
  token.endPosition = startPos + str.length;

  return token;
}

/**
 * Parses special values that [appear to be] standard YAML but
 * not supported by the yaml-ast-parser for some reason.
 *   - If the value is quoted, ignore it - it's a deliberate string
 *   - If the value uses a !!tag, we ignore it.
 *   - If the value has the `valueObject` property, the parser
 *     already recognized it - no need to process it.
 */
function parseSpecialValue(token: TokenRawValue): ?boolean | ?number {
  if(!token.singleQuoted && !token.doubleQuoted && !token.isTag && !token.hasOwnProperty('valueObject')) {
    if(REG_BOOL_TRUE.test(token.value)) {
      return true;
    }
    else if(REG_BOOL_FALSE.test(token.value)) {
      return false;
    }
    else if(REG_FORMATTED_NUMBER.test(token.value)) {
      return parseFloat(token.value.replace(/[,_]/g, ''));
    }
  }

  return undefined;
}

export default TokenSet;
