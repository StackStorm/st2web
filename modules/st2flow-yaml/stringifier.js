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

import type { AnyToken } from './types';

const strReducer = (str, token) => str + token.rawValue;

const buildString = (value, prefix = [], suffix = []) => {
  let str = prefix.reduce(strReducer, '');
  str += value;
  return suffix.reduce(strReducer, str);
};

const stringifier = {
  /**
   * Recursively stringifies tokens into YAML.
   */
  stringifyToken(token: AnyToken, str: string = ''): string {
    if(!token) {
      return str;
    }

    switch(token.kind) {
      case 0:
        str += buildString(token.rawValue, token.prefix);
        break;

      case 1:
        str += this.stringifyToken(token.key) + this.stringifyToken(token.value);
        break;

      case 2:
        str += token.mappings.reduce((s, t) => this.stringifyToken(t, s), '');
        str += token.suffix ? token.suffix.reduce(strReducer, '') : '';
        break;

      case 3:
        str += token.items.reduce((s, t) => this.stringifyToken(t, s), '');
        str += token.suffix ? token.suffix.reduce(strReducer, '') : '';
        break;

      case 4:
        str += buildString(token.referencesAnchor, token.prefix);
        break;
    }

    return str;
  },
};

export default stringifier;
