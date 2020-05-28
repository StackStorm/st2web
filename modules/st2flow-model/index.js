// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

import OrquestaModel from './model-orquesta';
import MistralModel from './model-mistral';

export { layout } from './layout';

const models = {};

[
  OrquestaModel,
  MistralModel,
].forEach(M => {
  M.runner_types.forEach(type => {
    models[type] = M;
  });
});

export { models, OrquestaModel, MistralModel };
