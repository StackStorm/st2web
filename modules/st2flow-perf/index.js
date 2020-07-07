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

const debug = require('debug')('st2flow.perf');
const IS_NODE = typeof process === 'object' && Object.prototype.toString.call(process) === '[object process]';

if (IS_NODE) {
  module.exports = {
    start() {},
    stop() {},
  };
}
else {
  performance.setResourceTimingBufferSize(150);

  module.exports = {
    start(name) {
      performance.mark(`${name}-start`);
    },

    stop(name) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);

      const measures = performance.getEntriesByName(name, 'measure');
      const dur = measures[measures.length - 1].duration;
      const average = measures.reduce((sum, m) => sum + m.duration, 0) / measures.length;

      debug(`${name} task took ${dur}ms and takes ${average}ms on average.`);
    },
  };
}

