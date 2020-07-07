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

import type { TokenRawValue, TokenMapping, TokenCollection, TokenReference, AnyToken, TokenMeta } from './types';
import crawler from './crawler';
import { isPlainObject, defineExpando } from './util';

const STR_BACKREF = '<<';

class Objectifier {
  anchors: Object;

  constructor(anchors: Object) {
    this.anchors = anchors;
  }

  getTokenValue(token: ?AnyToken, raw: boolean = false): any {
    if (token === null || typeof token === 'undefined') {
      return null;
    }

    switch(token.kind) {
      case 0:
        return raw === true ? token.rawValue :
          // The valueObject (if present) always contains the most primitive form
          // of the value (boolean, number, etc) - so use it first.
          token.hasOwnProperty('valueObject') ?
            token.valueObject : token.value;

      case 2:
        return this.getMapping(token);

      case 3:
        return this.getCollection(token);

      case 4:
        return this.getReference(token);

      default:
        throw new Error(`Unrecognized token kind: ${token.kind}`);
    }
  }

  /**
   * Mapping keys can be either single line or multiline.
   */
  getMappingKey(token: TokenRawValue | TokenCollection): string {
    switch(token.kind) {
      case 0: // single line key
        return this.getTokenValue(token);

      case 3: // multiline key
        return crawler.buildArrayKey(token);

      default:
        throw new Error(`Unrecognized key kind: ${token.kind}`);
    }
  }

  /**
   * This returns an object with a special __keys property which preserves
   * the original order of the keys in the YAML file. Consumers should use
   * the __keys property when order matters.
   */
  getMapping(token: TokenMapping): Object {
    const keys: Array<string> = [];
    const meta: TokenMeta = {
      keys,
      jpath: token.jpath,
      comments: '',
    };

    const result = token.mappings.reduce((obj, kvToken, i) => {
      const key = this.getMappingKey(kvToken.key);
      const value = this.getTokenValue(kvToken.value);

      if (key === STR_BACKREF) {
        // This object is extending (merging) another object, the value of
        // which has already been assigned to the "<<" property by
        // the time we get here. "value" might be an array objects which to extend.
        [].concat(value).forEach(v => {
          keys.unshift(...v.__meta.keys);
          obj = Object.assign({}, v, obj);
        });
      }
      else {
        keys.push(key);
        obj[key] = value;
      }

      if(isPlainObject(value)) {
        // value will already have a __meta property
        value.__meta.comments = crawler.getTokenComments(kvToken.key);
      }

      return obj;
    }, {});

    // Expand some useful info
    defineExpando(result, '__meta', meta);

    return result;
  }

  getCollection(token: TokenCollection): Array<any> {
    const result = token.items.map(t => this.getTokenValue(t));

    // Expand some useful info
    defineExpando(result, '__meta', {
      jpath: token.jpath,
      comments: crawler.getTokenComments(token),
    });

    return result;
  }

  getReference(token: TokenReference): any {
    const refToken = this.anchors[token.referencesAnchor];
    return this.getTokenValue(refToken);
  }
}

export default Objectifier;
