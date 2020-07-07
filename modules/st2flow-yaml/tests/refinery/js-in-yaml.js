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

// This is an example of YAML that contains JS-style data objects.
// The tests will mutate this data, and the expected result is
// defined below. If new edge cases are discovered, they should be
// added to this object, and the expected YAML below should be updated.
const source = `---
base: &base
  email: foo@bar.com

foobase: &foob
  <<: *base
  age: 10

plain: yaml
foo: {
  bar,  # annoying comment
  bar2: { <<: *foob, bazzz },
  buzz: {
    kill: 1234
  ,},
  existing: [ array ],
}
more:
  plain: yaml`;

// This data is added to the foo object as 'foo.bing' (see below)
const newData = {
  bar3: { buzz3: 'bar3' },
  buzz: 'bam',
  boo: [ 'boom' ],
};

// This is the expected result when the above jsonInYaml object is
// modified. If changes are made in the tests, they should be reflected here.
const result = `---
base: &base
  email: foo@bar.com

foobase: &foob
  <<: *base
  age: 10

plain: yaml
foo: {
  bar,  # annoying comment
  bar2: { <<: *foob, bazzz },
  buzz: {
    kill: 1234
  ,},
  existing: [ array ],
  bing: {
    bar3: {
      buzz3: bar3
    },
    buzz: bam,
    boo: [
      boom
    ]
  },
}
more:
  plain: yaml`;

export { source, result, newData };
