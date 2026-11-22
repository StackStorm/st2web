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

import { parseDocument } from 'yaml';

/**
 * Parses YAML with the `yaml` package and returns the node tree in the shape the rest of this
 * module was written against (that of the unmaintained yaml-ast-parser):
 *
 *   kind 0  scalar   { value, startPosition, endPosition, doubleQuoted, plainScalar?, singleQuoted?, valueObject? }
 *   kind 1  pair     { key, value, startPosition, endPosition }
 *   kind 2  mapping  { mappings, startPosition, endPosition }
 *   kind 3  sequence { items, startPosition, endPosition }
 *   kind 4  alias    { referencesAnchor, value, startPosition, endPosition }
 *
 * Any node may carry `anchorId`. Parse errors are collected on the root node's `errors`.
 * Positions are character offsets and follow yaml-ast-parser's conventions exactly, because
 * the token set derives comments and whitespace from the gaps between them.
 */
export function load(text) {
  const doc = parseDocument(text, { keepSourceTokens: true, uniqueKeys: true });
  const ctx = { text, anchors: new Map() };
  const root = convert(doc.contents, ctx);

  if (!root) {
    return null;
  }

  if (root.kind === 2) {
    // the document's top-level mapping runs to the end of the input
    root.endPosition = text.length;
  }

  root.errors = doc.errors.map(err => toException(err));

  return root;
}

function convert(node, ctx) {
  if (node === null || node === undefined) {
    return null;
  }

  let result;
  switch (node.constructor.name) {
    case 'Scalar':
      result = convertScalar(node, ctx);
      break;

    case 'YAMLMap':
      result = convertMap(node, ctx);
      break;

    case 'YAMLSeq':
      result = convertSeq(node, ctx);
      break;

    case 'Alias':
      result = {
        kind: 4,
        errors: [],
        referencesAnchor: node.source,
        value: ctx.anchors.get(node.source) || null,
        startPosition: node.range[0] + 1, // after the "*"
        endPosition: node.range[1],
      };
      break;

    default:
      throw new Error(`Unexpected YAML node ${node.constructor.name}`);
  }

  if (result && node.anchor) {
    result.anchorId = node.anchor;
    ctx.anchors.set(node.anchor, result);
  }

  return result;
}

function convertScalar(node, ctx) {
  // "key:" with nothing after it: an implicit null that has no source of its own
  if (!node.srcToken && node.range[0] === node.range[1]) {
    return null;
  }

  const [ start, valueEnd ] = node.range;
  const token = {
    kind: 0,
    errors: [],
    value: node.source,
    startPosition: start,
    endPosition: valueEnd,
    doubleQuoted: node.type === 'QUOTE_DOUBLE',
  };

  switch (node.type) {
    case 'PLAIN':
      token.plainScalar = true;
      if (!node.tag) {
        const typed = resolvePlain(node.source);
        if (typed !== NOT_TYPED) {
          token.valueObject = typed;
        }
      }
      break;

    case 'QUOTE_SINGLE':
      token.singleQuoted = true;
      break;

    case 'BLOCK_LITERAL':
    case 'BLOCK_FOLDED':
      // a block scalar runs over trailing blank lines, up to the last line break before the
      // next token
      token.endPosition = lastLineBreakBefore(ctx.text, nextTokenPosition(ctx.text, valueEnd, false), valueEnd);
      break;
  }

  token.rawValue = ctx.text.slice(token.startPosition, token.endPosition);

  return token;
}

function convertMap(node, ctx) {
  const mappings = node.items.map(pair => convertPair(pair, ctx));
  const [ start, valueEnd ] = node.range;

  return {
    kind: 2,
    errors: [],
    mappings,
    startPosition: start,
    // a block mapping ends with its last value; a flow mapping at its closing brace
    endPosition: isFlow(node) || !mappings.length ? valueEnd : mappings[mappings.length - 1].endPosition,
  };
}

function convertPair(pair, ctx) {
  const key = convert(pair.key, ctx);
  const value = convert(pair.value, ctx);

  return {
    kind: 1,
    errors: [],
    key,
    value,
    startPosition: key ? key.startPosition : pair.value.range[0],
    // a pair without a value ends right after its ":" (or, in a flow mapping, the space after the key)
    endPosition: value ? value.endPosition : separatorEnd(pair, key, ctx.text),
  };
}

function convertSeq(node, ctx) {
  return {
    kind: 3,
    errors: [],
    items: node.items.map(item => convert(item, ctx)),
    startPosition: node.range[0],
    // a block sequence runs on over blank lines and comments to the next token
    endPosition: isFlow(node) ? node.range[1] : endOfInput(ctx.text, nextTokenPosition(ctx.text, node.range[1])),
  };
}

function isFlow(node) {
  return !!node.srcToken && node.srcToken.type === 'flow-collection';
}

function separatorEnd(pair, key, text) {
  const sep = (pair.srcToken && pair.srcToken.sep) || [];
  const indicator = sep.find(t => t.type === 'map-value-ind');

  return indicator ? indicator.offset + 1 : nextTokenPosition(text, key.endPosition, false);
}

// Skips whitespace, and comments too unless told not to.
function nextTokenPosition(text, pos, comments = true) {
  const gap = comments ? /(?:[ \t\n]+|#[^\n]*)*/y : /[ \t\n]*/y;
  gap.lastIndex = pos;
  gap.test(text);

  return gap.lastIndex;
}

function lastLineBreakBefore(text, pos, min) {
  const index = text.lastIndexOf('\n', pos - 1);

  return index >= min - 1 ? index : pos;
}

// yaml-ast-parser appended a line break to input that didn't end with one, so a block
// sequence reaching the end of such input ends one character past it
function endOfInput(text, pos) {
  return pos >= text.length && !text.endsWith('\n') ? text.length + 1 : pos;
}

function toException(err) {
  const [ line, column ] = err.linePos ? [ err.linePos[0].line - 1, err.linePos[0].col - 1 ] : [ 0, 0 ];
  // yaml's message is "<reason> at line L, column C:" followed by a source excerpt
  const message = err.message.split('\n')[0].replace(/:$/, '');
  const reason = message.replace(/ at line \d+, column \d+$/, '');

  return {
    name: 'YAMLException',
    reason,
    message: `YAML Parser: ${message}`,
    mark: { line, column, position: err.pos[0] },
    isWarning: false,
  };
}

/*
 * Implicit typing of plain scalars, ported from the js-yaml 3 "default_safe" schema that
 * yaml-ast-parser used (js-yaml: MIT License, Copyright (C) 2011-2015 by Vitaly Puzrin), so
 * values keep the exact types they had: null, bool, int (incl. 0x, 0b, leading-0 octal and
 * base 60), float (a "." is required; .inf/.nan), timestamp, and the "<<" merge key.
 * Anything else stays a string. Explicitly tagged, quoted and block scalars are never typed.
 */
const NOT_TYPED = Symbol('not typed');

const REG_FLOAT = new RegExp('^(?:[-+]?(?:[0-9][0-9_]*)\\.[0-9_]*(?:[eE][-+][0-9]+)?' +
  '|\\.[0-9_]+(?:[eE][-+][0-9]+)?' +
  '|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*' +
  '|[-+]?\\.(?:inf|Inf|INF)' +
  '|\\.(?:nan|NaN|NAN))$');
const REG_TIMESTAMP = new RegExp('^([0-9][0-9][0-9][0-9])' +
  '-([0-9][0-9]?)' +
  '-([0-9][0-9]?)' +
  '(?:(?:[Tt]|[ \\t]+)' +
  '([0-9][0-9]?)' +
  ':([0-9][0-9])' +
  ':([0-9][0-9])' +
  '(?:\\.([0-9]*))?' +
  '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)' +
  '(?::([0-9][0-9]))?))?)?$');

export function resolvePlain(data) {
  if ([ '~', 'null', 'Null', 'NULL' ].includes(data)) {
    return null;
  }
  if ([ 'true', 'True', 'TRUE' ].includes(data)) {
    return true;
  }
  if ([ 'false', 'False', 'FALSE' ].includes(data)) {
    return false;
  }
  if (isInt(data)) {
    return constructInt(data);
  }
  if (REG_FLOAT.test(data)) {
    return constructFloat(data);
  }
  if (REG_TIMESTAMP.test(data)) {
    return constructTimestamp(data);
  }
  if (data === '<<') {
    return data;
  }

  return NOT_TYPED;
}

// js-yaml's integer check, kept character for character ("_" is ignored anywhere, so even
// "_1" is an integer).
function isInt(data) {
  const digitsOf = (str, test) => {
    let has = false;
    for (const ch of str) {
      if (ch === '_') {
        continue;
      }
      if (!test(ch)) {
        return false;
      }
      has = true;
    }
    return has;
  };

  const body = data[0] === '-' || data[0] === '+' ? data.slice(1) : data;

  if (body[0] === '0') {
    if (body.length === 1) {
      return true;
    }
    if (body[1] === 'b') {
      return digitsOf(body.slice(2), ch => ch === '0' || ch === '1');
    }
    if (body[1] === 'x') {
      return digitsOf(body.slice(2), ch => /[0-9a-fA-F]/.test(ch));
    }
    return digitsOf(body.slice(1), ch => /[0-7]/.test(ch));
  }

  const colon = body.indexOf(':');
  const head = colon === -1 ? body : body.slice(0, colon);

  if (!digitsOf(head, ch => /[0-9]/.test(ch))) {
    return false;
  }

  return colon === -1 || /^(:[0-5]?[0-9])+$/.test(body.slice(colon));
}

function constructInt(data) {
  let value = data.replace(/_/g, '');
  let sign = 1;

  if (value[0] === '-' || value[0] === '+') {
    if (value[0] === '-') {
      sign = -1;
    }
    value = value.slice(1);
  }

  if (value === '0') {
    return 0;
  }
  if (value[0] === '0') {
    if (value[1] === 'b') {
      return sign * parseInt(value.slice(2), 2);
    }
    if (value[1] === 'x') {
      return sign * parseInt(value, 16);
    }
    return sign * parseInt(value, 8);
  }
  if (value.includes(':')) {
    return sign * value.split(':').reduce((acc, part) => acc * 60 + parseInt(part, 10), 0);
  }

  return sign * parseInt(value, 10);
}

function constructFloat(data) {
  let value = data.replace(/_/g, '').toLowerCase();
  const sign = value[0] === '-' ? -1 : 1;

  if ('+-'.includes(value[0])) {
    value = value.slice(1);
  }

  if (value === '.inf') {
    return sign * Infinity;
  }
  if (value === '.nan') {
    return NaN;
  }
  if (value.includes(':')) {
    return sign * value.split(':').reduce((acc, part) => acc * 60 + parseFloat(part), 0);
  }

  return sign * parseFloat(value);
}

function constructTimestamp(data) {
  const match = REG_TIMESTAMP.exec(data);
  const [ year, month, day ] = [ +match[1], +match[2] - 1, +match[3] ];

  if (!match[4]) {
    return new Date(Date.UTC(year, month, day));
  }

  const fraction = match[7] ? +match[7].slice(0, 3).padEnd(3, '0') : 0;
  const date = new Date(Date.UTC(year, month, day, +match[4], +match[5], +match[6], fraction));

  if (match[9]) {
    const delta = (+match[10] * 60 + +(match[11] || 0)) * 60000;
    date.setTime(date.getTime() - (match[9] === '-' ? -delta : delta));
  }

  return date;
}
