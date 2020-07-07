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

import type { TokenRawValue, TokenKeyValue, TokenMapping, TokenCollection, ValueToken, AnyToken } from './types';
import { isPlainObject } from './util';

const REG_NEWLINE = /\n/;

const baseToken = {
  startPosition: 0,
  endPosition: 0,
  jpath: [],
  range: [{ row: 0, column: 0 }, { row: 0, column: 0 }],
};

type TokenOptions = {
  escape?: boolean,
};

/**
 * Factory used to create tokens from raw data.
 */
const factory = {
  get baseToken() {
    return Object.assign({}, baseToken);
  },

  /**
   * Given any type of YAML compatable data, creates an AST token.
   */
  createToken(data: any, options: TokenOptions = {}): ValueToken {
    if(Array.isArray(data)) {
      return this.createCollectionToken(data);
    }

    if(isPlainObject(data)) {
      return this.createMappingToken(data);
    }

    if(typeof data === 'string' || data instanceof String) {
      return this.createRawValueToken(data, undefined, options);
    }

    if(typeof data === 'undefined') {
      data = null;
    }

    return this.createRawValueToken(JSON.stringify(data), data);
  },

  /**
   * Given a value string, creates a raw value token (kind: 0)
   * The valObj is the object form of the value. This should be the
   * JS primitive/native form of the value (eg. dates, booleans, numbers, etc.).
   * The startPosition, endPosition, prefix, and jpath should be set
   * by the token-refinery.
   */
  createRawValueToken(val: string, valObj: any, options: TokenOptions = {}): TokenRawValue {
    const token: TokenRawValue = Object.assign({}, this.baseToken, {
      kind: 0,
      value: val,
      rawValue: val,
      doubleQuoted: false,
      plainScalar: true,
      prefix: [],
    });

    if(options.escape && /^[!%@&*`|>{["\s-]|[\s"]$|[\n#:]/.test(val)) {
      token.rawValue = `"${val.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;
    }

    else if(/^"|"$/.test(val.trim())) {
      // quotes need to be escaped if they bookend the value.
      token.rawValue = `"${val.replace(/"/g, '\\"')}"`;
    }

    if(typeof valObj !== 'undefined' && val !== valObj) {
      token.valueObject = valObj;
    }

    return token;
  },

  /**
   * Given a key and a value, creates a key/value token (kind: 1).
   * The value can be any type.
   */
  createKeyValueToken(key: string, val: any): TokenKeyValue {
    const token = Object.assign({}, this.baseToken, {
      kind: 1,
      key: this.createRawValueToken(key),
      value: this.createToken(val, { escape: true }),
    });

    if(isPlainObject(val) && val.__meta && val.__meta.comments) {
      this.addTokenComments(token.key, val.__meta.comments);
    }

    return token;
  },

  /**
   * Given a plain JS object, creates a mapping token (kind: 2).
   * The values can be a mix of types.
   */
  createMappingToken(data: Object): TokenMapping {
    const mappings = Object.keys(data).reduce((arr, key) => {
      arr.push(this.createKeyValueToken(key, data[key]));
      return arr;
    }, []);

    return Object.assign({}, baseToken, {
      kind: 2,
      mappings,
    });
  },

  /**
   * Given an array of values, creates a collection token (kind: 3).
   * The data can be a mix of types of values.
   */
  createCollectionToken(data: Array<any>): TokenCollection {
    const items = data.map(item => this.createToken(item));

    return Object.assign({}, baseToken, {
      kind: 3,
      items,
    });
  },

  /**
   * Adds comments to a token
   */
  addTokenComments(token: TokenRawValue | TokenCollection, comments: string): void {
    if(token.kind === 3 && token.items.length && token.items[0].kind === 0) {
      token = token.items[0];
    }

    if(token.kind === 0) {
      token.prefix = token.prefix.concat(comments.split(REG_NEWLINE).map(c => this.createRawValueToken(`# ${c}`)));
    }
  },

  /**
   * Adds range (row/column) information to a token
   */
  addRangeInfo(token: AnyToken, yaml: string): void {
    const start = yaml.slice(0, token.startPosition).split(REG_NEWLINE);
    const covers = yaml.slice(token.startPosition, token.endPosition).split(REG_NEWLINE);

    token.range = [{
      row: start.length - 1,
      column: start[start.length - 1].length,
    }, {
      row: start.length - 1 + covers.length - 1,
      column: covers[covers.length - 1].length,
    }];
  },
};

export default factory;
