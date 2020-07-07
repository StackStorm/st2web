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

// This is a plain JS object that will get converted to the expected
// YAML below. It is intentionally complex to ensure we can "refine"
// complex data into well-formatted YAML. If new edge cases are discovered,
// they should be added to this object, and the expected YAML below
// should be updated.
const source = {
  name: 'doSomething',
  action: 'some.action',
  anobject: {
    foo: 'bar',
  },
  nextitem: [
    {
      do: 'llama',
      when: 'depress',
    }, {
      dodo: [
        'taboot',
        [ 'tabooot', 'taboooot' ],
      ],
      when: 'depress depress',
    },
  ],
  arr: [
    [
      [
        {
          'asdf': [ 'boo' ],
          'qwer': 'reqw',
          'uiop': [ 'hjkl' ],
        },
        'sloth',
      ],
      'wombat',
    ],
  ],
  arr2: [
    [
      [
        'boohoo',
      ],
      'booboo',
    ],
  ],
  multilineString: `foo
  bar`,
};

// This is expected YAML representation of the object above. If new
// data is added to the object above, it should also be added here.
const result = `name: doSomething
action: some.action
anobject:
  foo: bar
nextitem:
  - do: llama
    when: depress
  - dodo:
      - taboot
      -
        - tabooot
        - taboooot
    when: depress depress
arr:
  -
    -
      - asdf:
          - boo
        qwer: reqw
        uiop:
          - hjkl
      - sloth
    - wombat
arr2:
  -
    -
      - boohoo
    - booboo
multilineString: "foo\\n  bar"`;

export { source, result };
