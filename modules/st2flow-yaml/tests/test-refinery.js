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

import { expect } from 'chai';
import factory from '../token-factory';
import crawler from '../crawler';
import TokenSet from '../token-set';
import TokenRefinery from '../token-refinery';

import { source as objSource, result as objResult } from './refinery/obj-to-yaml';
import { source as jsInYamlSource, result as jsInYamlResult, newData } from './refinery/js-in-yaml';

const DEFAULT_INDENT = '  ';

describe('Token Refinery', () => {
  it('refines plain object data into the correct yaml format', () => {
    const mappingToken = factory.createToken(objSource);
    const refinery = new TokenRefinery(mappingToken, DEFAULT_INDENT, '');
    const { yaml } = refinery.refineTree();
    expect(yaml).to.equal(objResult);
  });

  it('refines JS-like data embedded in yaml', () => {
    const set = new TokenSet(jsInYamlSource);

    // The crawler calls `set.refineTree()` internally
    crawler.assignMappingItem(set, 'foo.bing', newData);

    expect(set.toYAML()).to.equal(jsInYamlResult);
  });
});
