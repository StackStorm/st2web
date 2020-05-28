// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

// @flow

import type { ModelInterface } from './interfaces';

export function layout(model: ModelInterface) {
  model.tasks.forEach(task => {
    const { name } = task;
    model.updateTask({ name }, { coords: { x: -1, y: -1 }});
  });
}
