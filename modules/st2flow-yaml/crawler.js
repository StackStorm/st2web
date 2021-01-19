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

import type { TokenRawValue, TokenKeyValue, TokenMapping, TokenCollection, TokenReference, ParentToken, ValueToken, AnyToken, JPath, JpathKey, Range } from './types';

import factory from './token-factory';
import TokenSet from './token-set';
import { get, splitKey } from './util';

const REG_COMMENT = /^\s*#/;

const crawler = {
  getValueByKey(tokenSet: TokenSet, key: JpathKey): any {
    if(tokenSet) {
      return get(tokenSet.toObject(), key);
    }

    return undefined;
  },

  /**
   * Shorthand for setting a values on mappings or collections:
   *   - creates or replaces mappings values
   *   - pushes or splices collection values
   */
  set(tokenSet: TokenSet, key: JpathKey, value: any) {
    const keyArr: JPath = splitKey(key);
    const token: ?ValueToken = getTokenByKey(tokenSet.tree, keyArr);

    if(token) {
      this.replaceTokenValue(tokenSet, keyArr, value);
    }
    else {
      const parentPath: JPath = keyArr.slice(0, -1);
      const parentValue: ?ValueToken = getTokenValueByKey(tokenSet.tree, parentPath);

      if(!parentValue) {
        return;
      }

      switch(parentValue.kind) {
        case 2:
          this.assignMappingItem(tokenSet, keyArr, value);
          return;

        case 3: {
          let index = parseInt(keyArr[keyArr.length - 1], 10);

          if(isNaN(index) || index > parentValue.items.length) {
            index = parentValue.items.length;
          }

          this.spliceCollection(tokenSet, parentPath, index, 0, value);
          return;
        }
      }
    }
  },

  /**
   * Shorthand for deleting values from mappings or collections:
   *   - deletes keys from mappings
   *   - splices items out of collections
   */
  delete(tokenSet: TokenSet, key: JpathKey) {
    const keyArr: JPath = splitKey(key);
    const token: ?ValueToken = getTokenByKey(tokenSet.tree, keyArr);

    if(!token) {
      return;
    }

    const parentPath: JPath = keyArr.slice(0, -1);
    const parentToken: ParentToken = getTokenParent(tokenSet.tree, token);

    switch(parentToken.kind) {
      case 1: {
        this.deleteMappingItem(tokenSet, key);
        tokenSet.refineTree();
        break;
      }

      case 3: {
        let index = parseInt(keyArr[keyArr.length - 1], 10);

        if(isNaN(index) || index > parentToken.items.length) {
          index = parentToken.items.length;
        }

        this.spliceCollection(tokenSet, parentPath, index, 1);
        break;
      }

      default:
        throw new Error(`Cannot delete token of kind ${parentToken.kind} at path: ${parentToken.jpath.toString()}`);
    }
  },

  /**
   * Moves a value from one key to another.
   */
  moveTokenValue(tokenSet: TokenSet, fromKey: JpathKey, toKey: JpathKey) {
    const sourceKey = getTokenByKey(tokenSet.tree, fromKey);

    if(!sourceKey) {
      throw new Error(`Could not find token for source path: ${fromKey.toString()}`);
    }

    this.set(tokenSet, toKey, this.getValueByKey(tokenSet, fromKey));

    const oldFirst = this.findFirstValueToken(sourceKey);
    const destKey = getTokenByKey(tokenSet.tree, toKey);
    const newFirst = this.findFirstValueToken(destKey);
    this.delete(tokenSet, fromKey);

    newFirst.prefix = oldFirst.prefix;
    tokenSet.refineTree();
  },

  /**
   * Given a key and value, replaces the existing value with the new value.
   *
   * {
   *   version: 1,
   *   tasks: {
   *     task1: {
   *       action: "core.local"
   *     }
   *   }
   * }
   *
   * crawler.replaceTokenValue(tokenSet, 'tasks.task1', { action: 'aws.lambda' });
   *
   * {
   *   version: 1,
   *   tasks: {
   *     task1: {
   *       action: "aws.lambda"
   *     }
   *   }
   * }
   */
  replaceTokenValue(tokenSet: TokenSet, key: JpathKey, value: any) {
    const keyToken: ?ValueToken = getTokenByKey(tokenSet.tree, key);

    if(!keyToken) {
      throw new Error(`Could not find token for path: ${key.toString()}`);
    }

    const parentToken: ParentToken = getTokenParent(tokenSet.tree, keyToken);

    // Make sure to copy the old prefix
    switch(parentToken.kind) {
      case 1: {
        const oldFirst = this.findFirstValueToken(parentToken.value);
        parentToken.value = factory.createToken(value, { escape: true });

        const newFirst = this.findFirstValueToken(parentToken.value);
        if(newFirst && oldFirst) {
          newFirst.prefix = oldFirst.prefix;
        }
        tokenSet.refineTree();
        break;
      }

      case 3: {
        const index = parseInt(keyToken.jpath[keyToken.jpath.length - 1], 10);
        const oldFirst = this.findFirstValueToken(parentToken.items[index]);
        parentToken.items.splice(index, 1, factory.createToken(value, { escape: true }));

        const newFirst = this.findFirstValueToken(parentToken.items[index]);
        newFirst.prefix = oldFirst.prefix;
        tokenSet.refineTree();
        break;
      }

      default:
        throw new Error(`Cannot update token of kind ${parentToken.kind} at path: ${parentToken.jpath.toString()}`);
    }
  },

  /**
   * Adds a key/value pair to the "target" object.
   *
   * {
   *   version: 1,
   *   tasks: {
   *     task1: {
   *       action: "core.local"
   *     }
   *   }
   * }
   *
   * crawler.addMappingItem(tokenSet, 'tasks.task2', { action: 'core.local' });
   * crawler.addMappingItem(tokenSet, ['tasks', 'task2', 'input'], { cmd: 'echo "Hello World"' });
   *
   * {
   *   version: 1,
   *   tasks: {
   *     task1: {
   *       action: "core.local"
   *     },
   *     task2: {
   *       action: "core.local",
   *       input: {
   *         cmd: 'echo "Hello World"'
   *       }
   *     }
   *   }
   * }
   */
  assignMappingItem(tokenSet: TokenSet, targetKey: JpathKey, val: any) {
    const targKey: Array<string | number> = splitKey(targetKey);

    if(!targKey.length) {
      throw new Error(`Cannot add a key to a blank target: ${targetKey.toString()}`);
    }

    let token: TokenMapping;
    let newKey: string | number;

    if(targKey.length === 1) {
      token = tokenSet.tree;
      newKey = targKey[0];
    }
    else {
      const parentObjKey: Array<string | number> = targKey.slice(0, -1);
      token = getMappingTokenByKey(tokenSet.tree, parentObjKey);
      newKey = targKey[targKey.length - 1];
    }

    const kvToken = factory.createKeyValueToken(`${newKey}`, val);

    token.mappings.push(kvToken);
    tokenSet.refineTree();
  },

  /**
   * Renames the `targetKey` to the specified `val`
   *
   * {
   *   tasks: {
   *     task1: { ... }
   *   }
   * }
   *
   * crawler.renameMappingKey(tokenSet, 'tasks.task1', 'task2');
   *
   * {
   *   tasks: {
   *     task2: { ... }
   *   }
   * }
   *
   */
  renameMappingKey(tokenSet: TokenSet, targetKey: JpathKey, val: string) {
    const targKey: Array<string | number> = splitKey(targetKey);

    if(!targKey.length) {
      throw new Error(`Cannot rename a key on a blank target: ${targetKey.toString()}`);
    }

    const token: ?TokenRawValue = getRawTokenByKey(tokenSet.tree, targKey);

    if(!token) {
      throw new Error(`Could not find token: ${targetKey.toString()}`);
    }

    updateTokenValue(token, val);
    tokenSet.refineTree();
  },

  /**
   * Deletes the given key (and its value) from a mapping.
   *
   * {
   *   version: 1,
   *   tasks: {
   *     task1: {
   *       action: "core.local"
   *     }
   *   }
   * }
   *
   * crawler.deleteMappingItem(tokenSet, 'version');
   * crawler.deleteMappingItem(tokenSet, 'tasks.task1');
   */
  deleteMappingItem(tokenSet: TokenSet, key: JpathKey) {
    const token: ?ValueToken = getTokenByKey(tokenSet.tree, key);

    if (!token) {
      throw new Error(`Could not find token for path: ${key.toString()}`);
    }

    const parentKvToken: TokenKeyValue = getParentKVToken(tokenSet, token);
    const parentMappingToken = getParentMappingToken(tokenSet, parentKvToken);

    parentMappingToken.mappings.splice(+parentKvToken.jpath.slice(-1)[0], 1);
    tokenSet.refineTree();
  },

  /**
   * Works exactly like Array.prototype.splice for the target collection.
   *
   * {
   *   version: 1,
   *   items:
   *     - item 1
   *     - item 2
   *     - item 3
   * }
   *
   * crawler.spliceCollection(tokenSet, 'items', 1, 1, 'newItem');
   *
   * {
   *   version: 1,
   *   items:
   *     - item 1
   *     - newItem
   *     - item 3
   * }
   */
  spliceCollection(tokenSet: TokenSet, targetKey: JpathKey, start: number, deleteCount: number, ...items: Array<ValueToken>) {
    const token: TokenCollection = getCollectionTokenByKey(tokenSet.tree, targetKey);
    const tokens = items.map(item => factory.createToken(item, { escape: true }));

    token.items.splice(start, deleteCount, ...tokens);
    tokenSet.refineTree();
  },

  /**
   * Given a key, returns all comments which precede that key.
   * This will preserve newlines and strip leading hash/pound # signs.
   *
   * ---
   * version: 1.0
   * tasks:
   *   # [123, 456]
   *   # foo bar
   *   task1: ...
   *
   * crawler.getCommentsForKey(tokenSet, ['tasks', 'task1']);
   *
   * [123, 456]
   * foo bar
   */
  getCommentsForKey(tokenSet: TokenSet, key: JpathKey): string {
    const token: ?TokenRawValue = getRawTokenByKey(tokenSet.tree, key);

    if(!token) {
      throw new Error(`Could not find token for path: ${key.toString()}`);
    }

    return this.getTokenComments(token);
  },

  /**
   * Sets comment tokens for the given key
   */
  setCommentForKey(tokenSet: TokenSet, key: JpathKey, comments: string) {
    const token: ?TokenRawValue = getRawTokenByKey(tokenSet.tree, key);

    if(!token) {
      throw new Error(`Could not find token for path: ${key.toString()}`);
    }

    const tokens = comments.split(/\n/).map(comment => factory.createRawValueToken(`# ${comment}`));
    const lastToken = token.prefix.pop();

    token.prefix = token.prefix.filter(t => !REG_COMMENT.test(t.rawValue)).concat(tokens).concat(lastToken);
    tokenSet.refineTree();
  },

  /**
   * Gets the source range for a give key and its value
   */
  getRangeForKey(tokenSet: TokenSet, key: JpathKey): Range {
    const token: ?ValueToken = getTokenByKey(tokenSet.tree, key);

    if(!token) {
      throw new Error(`Could not find token for path: ${key.toString()}`);
    }

    const valueToken = getTokenValueByKey(tokenSet.tree, key);
    const lastToken = valueToken ? this.findLastValueToken(valueToken) || token : token;
    return [ token.range[0], lastToken.range[1] ];
  },

  /**
   * Recursively finds the first token of type 0 or 4
   */
  findFirstValueToken(token: AnyToken): ?TokenRawValue | ?TokenReference {
    if(token === null || typeof token === 'undefined') {
      return null;
    }

    switch(token.kind) {
      case 0:
      case 4:
        return token;

      case 1:
        return this.findFirstValueToken(token.key);

      case 2:
        return this.findFirstValueToken(token.mappings[0]);

      case 3:
        return this.findFirstCollectionItem(token.items);

      default:
        throw new Error(`Unrecognized token kind: ${token.kind}`);
    }
  },

  /**
   * Recursively finds the last token of type 0 or 4
   */
  findLastValueToken(token: AnyToken): ?TokenRawValue | ?TokenReference {
    if(token === null || typeof token === 'undefined') {
      return null;
    }

    switch(token.kind) {
      case 0:
      case 4:
        return token;

      case 1:
        // The "value" can be null (no token), so fall back to the key
        return this.findLastValueToken(token.value || token.key);

      case 2:
        return this.findLastValueToken(token.mappings[token.mappings.length - 1]);

      case 3:
        return this.findFirstCollectionItem(token.items, true);

      default:
        throw new Error(`Unrecognized token kind: ${token.kind}`);
    }
  },

  /**
   * Collection items can be null (no token), so crawl until we find one.
   */
  findFirstCollectionItem(items: Array<ValueToken>, fromEnd: boolean = false): ?TokenRawValue | ?TokenReference {
    let index = fromEnd ? items.length - 1 : 0;
    let token: ?ValueToken;

    while(!token && ((fromEnd && index >= 0) || (!fromEnd && index < items.length))) {
      token = items[fromEnd ? index-- : index++];  // eslint-disable-line no-plusplus
    }

    if(token) {
      token = fromEnd ? this.findLastValueToken(token) : this.findFirstValueToken(token);
    }

    return token;
  },

  getTokenComments(token: AnyToken): string {
    let comments = '';
    const firstToken: TokenRawValue = this.findFirstValueToken(token);

    if(firstToken) {
      comments = firstToken.prefix.filter(
        t => REG_COMMENT.test(t.rawValue)
      ).reduce((str, token, i) => {
        return str += `${i === 0 ? '' : '\n'}${token.rawValue.replace(REG_COMMENT, '').trim()}`;
      }, '');
    }

    return comments;
  },

  /**
   * YAML allows mapping keys to be constructed from a collection (array) of values.
   * The string version of the key is the result of Array.prototype.toString()
   */
  buildArrayKey(token: TokenCollection): string {
    return token.items.reduce((keys, t) => {
      if(t.kind === 0) {
        keys.push(t.value);
      }

      return keys;
    }, []).toString();
  },
};

/**
 * TokenSet consumers will often work with the "objectified" version
 * of the YAML file, which looks something like this:
 *
 * {
 *   version: 1,
 *   tasks: {
 *     task1: {
 *       action: "core.local"
 *     }
 *   }
 * }
 *
 * Given a key of "tasks.task1", this method will find the corresponding
 * "task1" token within the given branch. This method is recursive, and generally
 * the starting branch should always be the root node: tokenSet.tree.
 */
function getTokenByKey(branch: ?ValueToken, key: JpathKey): ?ValueToken {
  if (!branch) {
    return undefined;
  }

  const keyArr: Array<string | number> = splitKey(key);

  if(!keyArr.length) {
    return branch;
  }

  if(branch.kind === 0) {
    // The following mimicks the behavior of reading normal JS objects
    if(keyArr.length === 1) {
      // Trying to read a property on a scalar value - not possible.
      return undefined;
    }

    throw new Error(`Cannot read property ${keyArr[1]} of undefined.`);
  }

  const segment = keyArr.shift();

  switch(branch.kind) {
    case 2: {
      const kvToken: ?TokenKeyValue = branch.mappings.find(kvt =>
        (kvt.key.kind === 0 ? kvt.key.value : crawler.buildArrayKey(kvt.key)) === segment
      );

      if (!kvToken) {
        return undefined;
      }

      return getTokenByKey(keyArr.length ? kvToken.value : kvToken.key, keyArr);
    }

    case 3:
      return getTokenByKey(branch.items[+segment], keyArr);

    default:
      throw new Error(`Error looking up token for "${segment}.${keyArr.join('.')} on branch kind: ${branch.kind}`);
  }
}

function getRawTokenByKey(branch: ValueToken, key: JpathKey): ?TokenRawValue {
  const token: ?ValueToken = getTokenByKey(branch, key);

  if(!token || token.kind !== 0) {
    return null;
  }

  return token;
}

/**
 * Given a key such as "tasks.foo", returns the value as a token and
 * verifies it's the expected kind.
 */
function getTokenValueByKey(rootTree: TokenMapping, key: JpathKey): ?ValueToken {
  const token: ?ValueToken = getTokenByKey(rootTree, key);

  if (!token) {
    throw new Error(`Could not find token for path: ${key.toString()}`);
  }

  const parentToken: ParentToken = getTokenParent(rootTree, token);
  const valueToken: ?ValueToken = parentToken.kind === 1 ? parentToken.value : token;

  return valueToken;
}

function getMappingTokenByKey(rootTree: TokenMapping, key: JpathKey): TokenMapping {
  const token: ?ValueToken = getTokenValueByKey(rootTree, key);

  if (!token || token.kind !== 2) {
    throw new Error(`Could not find mapping token (kind: 2) for path: ${key.toString()}`);
  }

  return token;
}

function getCollectionTokenByKey(rootTree: TokenMapping, key: JpathKey): TokenCollection {
  const token: ?ValueToken = getTokenValueByKey(rootTree, key);

  if (!token || token.kind !== 3) {
    throw new Error(`Could not find collection token (kind: 3) for path: ${key.toString()}`);
  }

  return token;
}

/**
 * Given a token, returns the parent token from the AST.
 */
function getTokenParent(rootTree: TokenMapping, token: AnyToken): ParentToken {
  const result: ParentToken | Array<ParentToken> = get(rootTree, token.jpath.slice(0, -1));

  if(Array.isArray(result) || !result.hasOwnProperty('kind')) {
    return get(rootTree, token.jpath.slice(0, -2));
  }

  return result;
}

function getParentKVToken(tokenSet: TokenSet, token): TokenKeyValue {
  const kvToken: ParentToken = getTokenParent(tokenSet.tree, token);

  if(kvToken.kind !== 1) {
    throw new Error('The key must point to a valid mapping token.');
  }

  return kvToken;
}

function getParentMappingToken(tokenSet: TokenSet, token: TokenKeyValue): TokenMapping {
  const mToken: ParentToken = getTokenParent(tokenSet.tree, token);

  if(mToken.kind !== 2) {
    throw new Error('The key must point to a valid mapping token.');
  }

  return mToken;
}

/**
 * Sets the token value and rawValue, preserving quotes when necessary
 */
function updateTokenValue(token: TokenRawValue, value: string) {
  let rawValue = value;

  if(token.singleQuoted) {
    rawValue = `'${rawValue}'`;
  }
  else if(token.doubleQuoted) {
    rawValue = `"${rawValue}"`;
  }

  Object.assign(token, { value, rawValue });
}

export default crawler;
