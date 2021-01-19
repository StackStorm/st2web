// Copyright 2021 The StackStorm Authors.
// Copyright 2019 Extreme Networks, Inc.
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

module.exports = function (api) {
  api.cache(true);

  const presets = [
    '@babel/preset-react',
    '@babel/preset-env',
  ];
  const plugins = [
    '@babel/plugin-transform-flow-strip-types',
    [ '@babel/plugin-proposal-decorators', { 'legacy': true }],
    '@babel/plugin-proposal-class-properties',
    [ '@babel/plugin-proposal-object-rest-spread', { 'legacy': true }],
    '@babel/transform-runtime',
  ];

  return {
    presets,
    plugins,
  };
};
