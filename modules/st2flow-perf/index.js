// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

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

