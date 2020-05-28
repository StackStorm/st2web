// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

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
