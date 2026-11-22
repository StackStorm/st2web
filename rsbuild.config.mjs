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

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { defineConfig, rspack } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import postcssImport from 'postcss-import';
import postcssNested from 'postcss-nested';
import postcssPresetEnv from 'postcss-preset-env';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

function gitSha(short) {
  try {
    return execFileSync('git', [ 'rev-parse', ...(short ? [ '--short' ] : []), 'HEAD' ]).toString().trim();
  }
  catch (e) {
    return 'unknown';
  }
}

// Writes package.meta (ini) and package.meta.js next to index.html. The menu reads the
// version and sha from window.st2constants.st2PackageMeta, set by package.meta.js.
const pluginPackageMeta = () => ({
  name: 'st2web:package-meta',
  setup(api) {
    api.processAssets({ stage: 'additional' }, ({ compilation, sources }) => {
      const version = pkg.st2_version;
      const sha = gitSha(true);
      compilation.emitAsset(
        'package.meta',
        new sources.RawSource(`[st2web]\nversion = ${version}\ngit_sha = ${sha}\n`)
      );
      compilation.emitAsset(
        'package.meta.js',
        new sources.RawSource(
          `/* global angular */\nangular.module('main').constant('st2PackageMeta', { version: "${version}", git_sha: "${sha}"});\n`
        )
      );
    });
  },
});

// Where the dev server proxies /api, /auth and /stream. Point it at anything that serves
// those paths, e.g. the docker dev stack's st2web nginx (the default) or a real st2 host.
const st2Url = process.env.ST2_URL || 'http://127.0.0.1:8080';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginPackageMeta(),
  ],
  source: {
    entry: {
      // the entry name becomes the page name: build/index.html
      index: './main.js',
    },
  },
  html: {
    template: './index.html',
    title: 'StackStorm Web UI',
    // after the config.js / package.meta.js tags, like the old js/main.js tag
    inject: 'body',
    scriptLoading: 'blocking',
  },
  output: {
    distPath: {
      root: 'build',
      js: 'js',
      css: 'css',
    },
    // relative, like the old js/main.js tag, so the UI also works under a sub-path
    assetPrefix: './',
    filenameHash: true,
    cleanDistPath: true,
    // Stylesheets reference assets relative to the deployed build/css/ directory
    // (url(../img/logo.svg), url(../font/...)), so keep them as written and ship the
    // directories unchanged. config.js stays an unbundled, operator-editable file.
    copy: [
      { from: 'config.js' },
      { from: 'favicon.ico' },
      { from: 'img', to: 'img' },
      { from: 'font', to: 'font' },
    ],
    minify: {
      jsOptions: {
        minimizerOptions: {
          // st2flow-model uses constructor.name to tell workflow models apart
          compress: { keep_classnames: true, keep_fnames: true },
          mangle: { keep_classnames: true, keep_fnames: true },
        },
      },
    },
  },
  server: {
    port: Number(process.env.PORT) || 3000,
    host: '0.0.0.0',
    publicDir: false,
    proxy: {
      '/api': { target: st2Url, changeOrigin: true, secure: false },
      '/auth': { target: st2Url, changeOrigin: true, secure: false },
      '/stream': { target: st2Url, changeOrigin: true, secure: false },
    },
  },
  splitChunks: {
    preset: 'default',
  },
  tools: {
    cssLoader: {
      url: false,
    },
    // Only applied when CSS is emitted: Rstest compiles CSS modules for their class names and
    // skips PostCSS, so stylesheets must be valid CSS modules before nesting is flattened.
    postcss: (config, { addPlugins }) => {
      addPlugins([
        postcssImport(),
        postcssNested(),
        postcssPresetEnv({
          features: {
            'custom-properties': { preserve: false },
          },
        }),
      ], { order: 'pre' });
    },
    rspack: {
      resolve: {
        fallback: {
          // yaml-ast-parser only uses Buffer for !!binary values, guarded by `if (NodeBuffer)`
          buffer: false,
        },
      },
      plugins: [
        new rspack.BannerPlugin({
          banner: `Built ${new Date().toISOString()} from https://github.com/${pkg.repository}/commit/${gitSha(false)}`,
          entryOnly: true,
          // after minification, which would otherwise move it into a .LICENSE.txt file
          stage: rspack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
        }),
      ],
    },
  },
});
