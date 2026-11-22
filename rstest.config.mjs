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

import { defineConfig } from '@rstest/core';
import { withRsbuildConfig } from '@rstest/adapter-rsbuild';

const TESTS = [
  'apps/**/tests/**/test-*.js',
  'modules/**/tests/**/test-*.js',
];

// test-api reassigns window.location.host, which a real DOM does not allow, so it runs
// against the plain-object stubs from @stackstorm/module-test-utils/bootstrap instead.
const NODE_ONLY = [
  'modules/st2-api/tests/test-api.js',
];

const shared = {
  // same JS transforms and CSS-module class names as the app build (CSS itself isn't emitted)
  extends: withRsbuildConfig({ configPath: './rsbuild.config.mjs' }),
  output: {
    // resolve dependencies the way the app bundle does (CJS/UMD named-import interop)
    bundleDependencies: true,
  },
  tools: {
    // Rsbuild detects JSX in .js files by itself, but coverage re-parses untested files with
    // only these options, so name the syntax explicitly.
    swc: { jsc: { parser: { syntax: 'ecmascript', jsx: true } } },
  },
};

export default defineConfig({
  projects: [
    {
      ...shared,
      name: 'dom',
      include: TESTS,
      exclude: [ '**/node_modules/**', ...NODE_ONLY ],
      testEnvironment: {
        name: 'jsdom',
        options: { url: 'https://example.com/' },
      },
      setupFiles: [
        './modules/st2-test-utils/bootstrap/react.js',
        './modules/st2-test-utils/bootstrap/st2constants.js',
        './modules/st2-test-utils/bootstrap/title.js',
      ],
    },
    {
      ...shared,
      name: 'node',
      include: NODE_ONLY,
      testEnvironment: 'node',
    },
  ],
  coverage: {
    provider: 'istanbul',
    include: [ 'apps/**/*.js', 'modules/**/*.js' ],
    exclude: [ '**/tests/**', '**/node_modules/**', 'modules/st2-test-utils/**' ],
    reporters: [ 'text-summary', 'html' ],
  },
});
