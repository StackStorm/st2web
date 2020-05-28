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

import TestRenderer from 'react-test-renderer';

export class ReactInstanceTester {
  static create(instance) {
    if (typeof instance === 'string') {
      return instance;
    }

    return new this(instance);
  }

  constructor(instance) {
    this._instance = instance;
  }

  get type() {
    return this._instance.type;
  }

  get props() {
    return this._instance.props || {};
  }

  get parent() {
    return ReactInstanceTester.create(this._instance.parent);
  }

  get children() {
    return (this._instance.children || [])
      .map(instance => ReactInstanceTester.create(instance))
    ;
  }

  get className() {
    return this.props.className || '';
  }

  get classList() {
    return this.className.split(' ').filter(v => v);
  }

  get text() {
    return this.children
      .map(instance => typeof instance === 'string' ? instance : instance.text)
      .filter(v => typeof v === 'string')
      .map(v => v.trim())
      .join(' ')
    ;
  }


  findTests(id) {
    return this.findAllByProps({'data-test': id});
  }
}

const methods = [ 'find', 'findByType', 'findByProps', 'findAll', 'findAllByType', 'findAllByProps' ];
for (const method of methods) {
  if (method.startsWith('findAll')) {
    ReactInstanceTester.prototype[method] = function(...args) {
      return this._instance[method](...args)
        .map(instance => ReactInstanceTester.create(instance))
      ;
    };
  }
  else {
    ReactInstanceTester.prototype[method] = function(...args) {
      return ReactInstanceTester.create(this._instance[method](...args));
    };
  }
}

export class ReactTester extends ReactInstanceTester {
  constructor(component) {
    const render = TestRenderer.create(component);

    super(render.root);

    this._render = render;
  }

  get node() {
    return this.children[0];
  }

  toJSON() {
    return this._render.toJSON();
  }
}
