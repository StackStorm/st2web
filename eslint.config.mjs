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

import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import react from '@eslint-react/eslint-plugin';
import globals from 'globals';

const LICENSE_HEADER = '(// Copyright \\d{4} [a-zA-Z0-9,\\.\\s]+\\n)+//\\n// Licensed under the Apache License, Version 2\\.0 \\(the "License"\\);\\n// you may not use this file except in compliance with the License\\.\\n// You may obtain a copy of the License at\\n//\\n//\\s+http://www\\.apache\\.org/licenses/LICENSE-2\\.0\\n//\\n// Unless required by applicable law or agreed to in writing, software\\n// distributed under the License is distributed on an "AS IS" BASIS,\\n// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied\\.\\n// See the License for the specific language governing permissions and\\n// limitations under the License\\.\\n';

// Every source file starts with the Apache 2.0 header (one or more copyright lines, then the
// license text). A local rule, since eslint-plugin-notice doesn't run on ESLint 10.
const license = {
  rules: {
    header: {
      meta: {
        type: 'problem',
        messages: { missing: 'Missing or malformed Apache 2.0 license header.' },
        schema: [],
      },
      create(context) {
        const header = new RegExp(`^(#!.*\\n)?${LICENSE_HEADER}`);
        return {
          Program(node) {
            if (!header.test(context.sourceCode.text)) {
              context.report({ node, loc: { line: 1, column: 0 }, messageId: 'missing' });
            }
          },
        };
      },
    },
  },
};

export default [
  {
    ignores: [
      '**/node_modules/**',
      'build/**',
      'coverage/**',
      'js/**',
      'css/**',
      'package.meta.js',
      // Playwright output (bundled report viewer)
      'test-results/**',
      'playwright-report/**',
    ],
  },

  js.configs.recommended,
  // also covers the rules of hooks; ESLint 10's no-unused-vars understands JSX on its own
  react.configs.recommended,

  {
    files: [ '**/*.{js,mjs}' ],
    plugins: {
      '@stylistic': stylistic,
      license,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'block-scoped-var': 'error',
      camelcase: 'off',
      'consistent-return': 'error',
      curly: [ 'error', 'all' ],
      'dot-notation': [ 'error', { allowKeywords: true }],
      eqeqeq: [ 'error', 'allow-null' ],
      strict: 'off',
      'new-cap': 'error',
      'no-bitwise': 'error',
      'no-caller': 'error',
      'no-case-declarations': 'off',
      'no-cond-assign': [ 'error', 'except-parens' ],
      'no-debugger': 'error',
      'no-empty': 'error',
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-irregular-whitespace': 'error',
      'no-iterator': 'error',
      'no-loop-func': 'error',
      'no-multi-str': 'error',
      'no-new': 'error',
      'no-plusplus': 'error',
      'no-proto': 'error',
      'no-script-url': 'error',
      'no-sequences': 'error',
      'no-undef': 'error',
      'no-unused-vars': [ 'error', { args: 'none', caughtErrors: 'none' }],
      'no-with': 'error',
      'one-var': [ 'error', 'never' ],
      'valid-typeof': 'error',
      'no-warning-comments': 'warn',
      'no-console': 'warn',
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-const': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'prefer-template': 'error',

      // formatting (moved out of ESLint core / eslint-plugin-react into @stylistic)
      '@stylistic/array-bracket-spacing': [ 'error', 'always', { objectsInArrays: false, arraysInArrays: false }],
      '@stylistic/arrow-spacing': 'error',
      '@stylistic/brace-style': [ 'error', 'stroustrup' ],
      // function arguments were never checked under the old ES6 parser setting
      '@stylistic/comma-dangle': [ 'error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'ignore',
      }],
      '@stylistic/indent': [ 'error', 2, { SwitchCase: 1 }],
      '@stylistic/quotes': [ 'error', 'single' ],
      '@stylistic/rest-spread-spacing': 'error',
      '@stylistic/semi': [ 'error', 'always' ],
      '@stylistic/space-before-blocks': 'error',
      '@stylistic/template-curly-spacing': 'error',
      '@stylistic/wrap-iife': [ 'error', 'inside' ],
      '@stylistic/jsx-closing-bracket-location': 'error',
      '@stylistic/jsx-closing-tag-location': 'error',
      '@stylistic/jsx-curly-spacing': 'error',
      '@stylistic/jsx-equals-spacing': 'error',
      '@stylistic/jsx-first-prop-new-line': [ 'error', 'multiline' ],
      '@stylistic/jsx-pascal-case': 'error',
      '@stylistic/jsx-self-closing-comp': 'error',
      '@stylistic/jsx-tag-spacing': 'error',
      '@stylistic/jsx-wrap-multilines': [ 'error', {
        declaration: 'parens-new-line',
        assignment: 'parens-new-line',
        return: 'parens-new-line',
        arrow: 'parens-new-line',
        condition: 'parens-new-line',
        logical: 'parens-new-line',
        prop: 'parens-new-line',
      }],

      // on top of @eslint-react's recommended set
      '@eslint-react/dom-no-unknown-property': 'error',
      '@eslint-react/dom-no-string-style-prop': 'error',
      '@eslint-react/no-duplicate-key': 'error',
      '@eslint-react/no-unused-state': 'error',

      'license/header': 'error',
    },
  },

  {
    // Playwright functional tests: no React here (fixtures receive a `use` callback, not a hook)
    files: [ 'tests/**/*.js' ],
    rules: {
      '@eslint-react/rules-of-hooks': 'off',
    },
  },

  {
    // operator-editable runtime config, loaded as a classic script before the bundle
    files: [ 'config.js' ],
    languageOptions: {
      sourceType: 'script',
    },
  },
];
