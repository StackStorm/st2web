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

import { expect } from 'chai';

import scrollIntoView from '..';

describe('proportional', () => {
  it('accepts null arguments', () => {
    scrollIntoView(null, null);
    scrollIntoView(null, {});
    scrollIntoView({}, null);
  });

  describe('scrolling up', () => {
    it('sets the container scrollTop properly', () => {
      scrollIntoView({
        get scrollTop() {
          return 100;
        },
        set scrollTop(value) {
          expect(value).to.equal(150);
        },
        getBoundingClientRect: () => ({ top: 100, height: 100 }),
      }, {
        getBoundingClientRect: () => ({ top: 200, height: 50 }),
      });
    });
  });

  describe('scrolling down', () => {
    it('sets the container scrollTop properly', () => {
      scrollIntoView({
        get scrollTop() {
          return 100;
        },
        set scrollTop(value) {
          expect(value).to.equal(0);
        },
        getBoundingClientRect: () => ({ top: 200, height: 100 }),
      }, {
        getBoundingClientRect: () => ({ top: 100, height: 50 }),
      });
    });
  });

  describe('not scrolling', () => {
    it('sets the container scrollTop properly', () => {
      scrollIntoView({
        get scrollTop() {
          return 100;
        },
        set scrollTop(value) {
          throw new Error('scrollTop should not be called.');
        },
        getBoundingClientRect: () => ({ top: 100, height: 100 }),
      }, {
        getBoundingClientRect: () => ({ top: 125, height: 50 }),
      });
    });
  });
});
