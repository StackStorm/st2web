// Copyright 2026 The StackStorm Authors.
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

import { describe, it, beforeEach, afterEach, rs } from '@rstest/core';
import { expect } from 'chai';
import sinon from 'sinon';

import perf from '..';

// The module picks its implementation when it loads, by asking whether `process` is Node's.
// Loading it again with that answer changed gives the browser implementation.
async function loadBrowserPerf() {
  const tag = process[Symbol.toStringTag];
  process[Symbol.toStringTag] = 'Window';
  try {
    rs.resetModules();
    const browserPerf = await import('..');
    const debug = await import('debug');
    return { perf: browserPerf.default || browserPerf, debug: debug.default || debug };
  }
  finally {
    process[Symbol.toStringTag] = tag;
  }
}

describe('st2flow-perf', () => {
  describe('under Node', () => {
    it('does nothing, so model code can time itself anywhere', () => {
      const mark = sinon.spy(performance, 'mark');

      expect(() => {
        perf.start('parse');
        perf.stop('parse');
        perf.stop('never-started');
      }).not.to.throw();
      expect(mark.called).to.be.false;

      sinon.restore();
    });
  });

  describe('in the browser', () => {
    let browser;

    beforeEach(async () => {
      browser = await loadBrowserPerf();
    });

    afterEach(() => {
      performance.clearMarks();
      performance.clearMeasures();
      browser.debug.disable();
      sinon.restore();
    });

    it('records a measure between start and stop', () => {
      browser.perf.start('render');
      browser.perf.stop('render');

      const measures = performance.getEntriesByName('render', 'measure');
      expect(measures).to.have.length(1);
      expect(measures[0].duration).to.be.at.least(0);
      expect(performance.getEntriesByName('render-start', 'mark')).to.have.length(1);
      expect(performance.getEntriesByName('render-end', 'mark')).to.have.length(1);
    });

    it('keeps every run, so it can report an average', () => {
      const log = sinon.stub(browser.debug, 'log');
      browser.debug.enable('st2flow.perf');

      browser.perf.start('layout');
      browser.perf.stop('layout');
      browser.perf.start('layout');
      browser.perf.stop('layout');

      expect(performance.getEntriesByName('layout', 'measure')).to.have.length(2);
      expect(log.callCount).to.equal(2);
      expect(log.lastCall.args[0]).to.match(/layout task took [\d.]+ms and takes [\d.]+ms on average\./);
    });

    it('stays quiet unless st2flow.perf debugging is enabled', () => {
      const log = sinon.stub(browser.debug, 'log');
      browser.debug.disable();

      browser.perf.start('quiet');
      browser.perf.stop('quiet');

      expect(log.called).to.be.false;
    });
  });
});
