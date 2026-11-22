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

import BaseClass from './base-class';
import schema from './schemas/metadata.json';

class MetaModel extends BaseClass {
  constructor(yaml) {
    super(schema, yaml);
  }

  static minimum = 'pack: default\nenabled: true\n';

  get name() {
    return this.get('name');
  }

  get description() {
    return this.get('description');
  }

  get enabled() {
    return this.get('enabled');
  }

  get entry_point() {
    return this.get('entry_point');
  }

  get pack() {
    return this.get('pack');
  }

  get runner_type() {
    return this.get('runner_type');
  }

  get parameters() {
    return this.get('parameters');
  }
}

export default MetaModel;
