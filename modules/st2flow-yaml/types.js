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

type JPath = Array<string | number>;

type JpathKey = string | JPath;

type RowColumn = { row: number, column: number };

type Range = [ RowColumn, RowColumn ];

type BaseToken = {
	startPosition: number,
  endPosition: number,
  jpath: JPath,
  range: Range,
};

type TokenRawValue = BaseToken & {
	kind: 0,
	value: string,
  rawValue: string,
  doubleQuoted: boolean,
  plainScalar: boolean,
  prefix: Array<TokenRawValue>,

  singleQuoted?: boolean,
  valueObject?: any,
  anchorId?: string,
  isTag?: boolean,
};

type TokenKeyValue = BaseToken & {
	kind: 1,
	key: TokenRawValue | TokenCollection,
	value: ?ValueToken,
};

type TokenMapping = BaseToken & {
	kind: 2,
  mappings: Array<TokenKeyValue>,
  suffix?: Array<TokenRawValue>,
  anchorId?: string,
};

type TokenCollection = BaseToken & {
	kind: 3,
  items: Array<ValueToken>,
  suffix?: Array<TokenRawValue>,
};

type TokenReference = BaseToken & {
	kind: 4,
  referencesAnchor: string,
  value: BaseToken,
  prefix: Array<TokenRawValue>,
  isTag?: boolean,
};

type ParentToken = TokenKeyValue | TokenMapping | TokenCollection;
type ValueToken = TokenRawValue | TokenMapping | TokenCollection | TokenReference;
type AnyToken = TokenRawValue | TokenKeyValue | TokenMapping | TokenCollection | TokenReference;

type Refinement = {
  tree: TokenMapping,
  yaml: string
};

/**
 * This information is exposed during "objectification" and provides
 * metatdata about the original YAML tokens.
 */
type TokenMeta = {
  jpath: JPath, // provides the jpath to the token
  comments: string, // provides any comments associated with the token

  keys?: Array<string>, // for mappings (objects), provides the keys in YAML source order
  inlineInput?: boolean, // whether or not "input" statements are declared as inline string
  withString?: boolean, // whether or not the "with" statements are declared as inline string
};

export type {
  JPath,
  TokenRawValue,
  TokenKeyValue,
  TokenMapping,
  TokenCollection,
  TokenReference,
  ParentToken,
  ValueToken,
  AnyToken,
  Refinement,
  TokenMeta,
  JpathKey,
  Range,
};
