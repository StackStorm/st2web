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

import _ from 'lodash';

export default function() {
  let debounced = null;

  return function(ref) {
    if (!ref) {
      window.removeEventListener('resize', debounced, false);
      debounced = null;
      return;
    }

    debounced = _.debounce(makeProportional.bind(null, ref), 200);
    window.addEventListener('resize', debounced, false);
  };
}

function makeProportional(container) {
  const children = Array.prototype.slice.call(container.children);
  const childrenByWidth = children.map((child) => {
    if (child.style.width) {
      child.style.width = null;
    }

    return {
      element: child,
      width: child.offsetWidth,
    };
  });
  childrenByWidth.sort(({ width: a }, { width: b }) => b - a);
  let childrenWidth = childrenByWidth.reduce((width, child) => width + child.width, 0);

  const containerStyle = getComputedStyle(container);
  const containerWidth = container.clientWidth
    - parseInt(containerStyle.getPropertyValue('padding-left'), 10)
    - parseInt(containerStyle.getPropertyValue('padding-right'), 10);

  if (childrenWidth <= containerWidth) {
    return;
  }

  const childrenToShrink = [];
  while (childrenToShrink.length < children.length && childrenWidth > containerWidth) {
    childrenToShrink.push(childrenByWidth[childrenToShrink.length]);

    const nextChild = childrenByWidth[childrenToShrink.length];
    const newWidth = nextChild ? nextChild.width : containerWidth / children.length;

    childrenToShrink.forEach((child) => child.width = newWidth);
    childrenWidth = childrenByWidth.reduce((width, child) => width + child.width, 0);
  }

  const extraSpace = (containerWidth - childrenWidth) / childrenToShrink.length;
  childrenToShrink.forEach((child) => {
    // Note: Currently only works with box-sizing: border-box
    child.element.style.width = `${child.width + extraSpace}px`;
  });
}
