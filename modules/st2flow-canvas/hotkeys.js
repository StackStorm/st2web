// Copyright 2021 The StackStorm Authors.
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

import { useEffect, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

// One document-wide shortcut. Keys typed into inputs and textareas are left alone.
function HotKey({ keys, handler }) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useHotkeys(keys, (event) => handlerRef.current(event));

  return null;
}

// keyMap maps an action name to its key combos ('command' is the Mac ⌘ key); handlers maps it to a function.
export default function HotKeys({ keyMap, handlers, children, ...props }) {
  return (
    <div {...props}>
      { Object.entries(keyMap).filter(([ action ]) => handlers[action]).map(([ action, combos ]) => (
        <HotKey
          key={action}
          keys={combos.map(combo => combo.replace('command', 'meta'))}
          handler={handlers[action]}
        />
      )) }
      { children }
    </div>
  );
}
