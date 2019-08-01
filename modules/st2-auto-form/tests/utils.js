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

import { ReactTester } from '@stackstorm/module-test-utils';

export class TestComponent {
  constructor(component) {
    this._instance = ReactTester.create(component);
  }

  field() {
    try {
      return this._instance.find((instance) => {
        if (!instance.props.className) {
          return false;
        }

        return instance.props.className.split(' ').includes('st2-auto-form__field');
      });
    }
    catch (e) {
      return this._instance.find((instance) => {
        if (!instance.props.className) {
          return false;
        }

        return instance.props.className.split(' ').includes('st2-auto-form__checkbox');
      });
    }
  }

  makeChange(value, name) {
    const event = {
      stopPropagation: () => {},
      target: { value },
    };
    if (name) {
      event.target[name] = value;
    }

    const field = this.field();
    field.props.onChange(event);
  }

  fieldType() {
    return this.field()._instance.type;
  }

  fieldValue(name) {
    return this.field().props[name || 'value'];
  }

  fieldClass() {
    return this.field().props.className;
  }

  value() {
    const instance = this._instance._instance.instance;
    return instance.fromStateValue(instance.state.value);
  }
}
