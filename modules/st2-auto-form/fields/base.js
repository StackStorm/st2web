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
import React from 'react';

import { TextFieldWrapper } from '../wrappers';
import TextareaAutosize from 'react-textarea-autosize';

export const Textarea = TextareaAutosize;

export function isJinja(v) {
  return _.isString(v) && v.startsWith('{{') && v.endsWith('}}');
}

export function isYaql(v) {
  return _.isString(v) && v.startsWith('<%') && v.endsWith('%>');
}

// TODO: make controlled
export class BaseTextField extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: this.toStateValue(this.props.value),
      visible: false,
    };
  }

  componentDidUpdate(prevProps) {
    // Uncontrolled: the field keeps its own value and only resets it when the value prop itself changes.
    // getDerivedStateFromProps can't tell which of props or state is newer. Making the fields controlled would fix that.
    const { value } = this.props;

    if (!_.isEqual(prevProps.value, value)) {
      this.setState({ value: this.toStateValue(value) });
    }
  }

  fromStateValue() {
    throw new Error('not implemented');
  }

  toStateValue() {
    throw new Error('not implemented');
  }

  validate(v, spec={}) {
    if ((v === '' || v === undefined) && spec.required) {
      return 'parameter is required';
    }
    

    if (isJinja(v)) {
      return false;
    }

    if (isYaql(v)) {
      return false;
    }

    return undefined;

  }

  handleChange(e, value) {
    e.stopPropagation();
    const invalid = this.validate(value, this.props.spec);
    
    if (this.props.name === 'timeout' || this.props.name === 'limit') {
      this.setState({ value, invalid }, this.props.onChange ? this.emitChange : undefined);
    } 
    else {
      this.setState({ value, invalid }, this.props.onChange && !invalid ? this.emitChange : undefined);
    }
  }

  visibilityToggle() {
    this.setState(({ visible }) => ({ visible: !visible }));
  }

  emitChange() {
    return this.props.onChange(this.fromStateValue(this.state.value));
  }

  render() {
    const { icon } = this.constructor;
    const { invalid } = this.state;
    const { spec={} } = this.props;
    const wrapperProps = Object.assign({}, this.props, {
      visibilityToggle: () => this.visibilityToggle(),
      visible: this.state.visible,
    });
    
    if (invalid) {
      wrapperProps.invalid = invalid;
    }

    const inputProps = {
      className: spec.secret && !this.state.visible ? 'st2-auto-form__field--secret' : 'st2-auto-form__field',
      type: 'text',
      placeholder:this.toStateValue(spec.default),
      disabled: this.props.disabled,
      value: this.state.value,
      spellCheck: spec.secret && !this.state.visible ? false : true,
      onChange: (e) => this.handleChange(e, e.target.value),
      'data-test': this.props['data-test'],
    };

    if (this.state.invalid) {
      inputProps.className += ' ' + 'st2-auto-form__field--invalid';
    }

    return (
      <TextFieldWrapper icon={icon} {...wrapperProps}>
        <input {...inputProps} />
      </TextFieldWrapper>
    );
  }
}

export class BaseTextareaField extends BaseTextField {
  render() {
    const { icon } = this.constructor;
    const { invalid } = this.state;
    const { spec = {} } = this.props;

    const wrapperProps = Object.assign({}, this.props, {
      visibilityToggle: () => this.visibilityToggle(),
      visible: this.state.visible,
    });
    
    if (invalid) {
      wrapperProps.invalid = invalid;
    }

    const inputProps = {
      className: spec.secret && !this.state.visible ? 'st2-auto-form__field--secret' : 'st2-auto-form__field',
      placeholder:  this.toStateValue(spec.default),
      disabled: this.props.disabled,
      value: this.state.value,
      spellCheck: spec.secret && !this.state.visible ? false : true,
      onChange: (e) => this.handleChange(e, e.target.value),
      minRows: 1,
      maxRows: 10,
      'data-test': this.props['data-test'],
    };

    if (this.state.invalid) {
      inputProps.className += ' ' + 'st2-auto-form__field--invalid';
    }

    return (
      <TextFieldWrapper icon={icon} {...wrapperProps}>
        <Textarea {...inputProps} />
      </TextFieldWrapper>
    );
  }
}
