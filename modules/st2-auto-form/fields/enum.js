import _ from 'lodash';
import React from 'react';
import { BaseTextField } from './base';

import { TextFieldWrapper } from '../wrappers';

export default class EnumField extends BaseTextField {
  static icon = 'V'

  fromStateValue(v) {
    return v !== '' ? v : void 0;
  }

  toStateValue(v) {
    return v || '';
  }

  validate(v, spec={}) {
    const invalid = super.validate(v, spec);
    if (invalid !== void 0) {
      return invalid;
    }

    return v && !_.includes(spec.enum, v) && `'${v}' not in enum`;
  }

  render() {
    const { spec={} } = this.props;
    const { invalid } = this.state;

    const wrapperProps = Object.assign({}, this.props, {
      labelClass: 'st2-auto-form__select',
    });

    if (invalid) {
      wrapperProps.invalid = invalid;
    }

    const selectProps = {
      className: 'st2-auto-form__field',
      disabled: this.props.disabled,
      value: this.state.value,
      onChange: (e) => this.handleChange(e, e.target.value),
    };

    if (this.state.invalid) {
      selectProps.className += ' ' + 'st2-auto-form__field--invalid';
    }

    return (
      <TextFieldWrapper {...wrapperProps}>
        <select {...selectProps}>
          { spec.default ? null : (
            <option value='' />
          ) }
          { _.map(spec.enum, (v) => (
            <option key={v} value={v}>{ v }</option>
          )) }
        </select>
      </TextFieldWrapper>
    );
  }
}
