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

import BaseClass from './base-class';

/**
 * The BaseModel class is intended to be extended by the primary models:
 * Orquesta, Mistra, ActionChain
 *
 * This is based on the server model:
 * https://github.com/StackStorm/orquesta/tree/master/orquesta/specs
 */
class BaseModel extends BaseClass {
  get name() {
    return this.get('name');
  }

  get version() {
    return this.get('version');
  }

  get description() {
    return this.get('description');
  }

  get tags() {
    return this.get('tags');
  }
}

export default BaseModel;
