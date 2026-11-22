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

import { act, cloneElement, createRef } from 'react';
import { render, fireEvent } from '@testing-library/react';

// Renders one auto-form field and works it through its input element.
export class TestComponent {
  constructor(component) {
    this._ref = createRef();
    // the ref gives value() the field instance; cloning is how it gets onto the element under test
    // eslint-disable-next-line @eslint-react/no-clone-element
    this.container = render(cloneElement(component, { ref: this._ref })).container;
  }

  // the field's input, textarea, select or checkbox
  field() {
    return this.container.querySelector('.st2-auto-form__field, .st2-auto-form__checkbox');
  }

  makeChange(value, name) {
    const field = this.field();

    if (name === 'checked' && typeof value === 'boolean') {
      if (field.checked !== value) {
        fireEvent.click(field);
      }
      return;
    }

    const isOption = field.tagName !== 'SELECT' || [ ...field.options ].some(o => o.value === value);
    if (!name && isOption) {
      fireEvent.change(field, { target: { value } });
      return;
    }

    // A value the element itself can't take (an option the select doesn't have, a checkbox
    // state that isn't a boolean) goes straight to the field's change handler, to test validation.
    act(() => this._ref.current.handleChange({ stopPropagation() {} }, value));
  }

  // "input", "textarea", "select"
  fieldType() {
    return this.field().tagName.toLowerCase();
  }

  fieldValue(name) {
    return this.field()[name || 'value'];
  }

  fieldClass() {
    return this.field().className;
  }

  // the value the field would emit
  value() {
    const instance = this._ref.current;
    return instance.fromStateValue(instance.state.value);
  }
}
