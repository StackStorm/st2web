// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

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
