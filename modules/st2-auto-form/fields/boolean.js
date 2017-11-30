import React from 'react';

import { BaseTextField } from './base';
import { BooleanFieldWrapper } from '../wrappers';

export default class BooleanField extends BaseTextField {
  toStateValue(v) {
    return v !== void 0 ? !!v : void 0;
  }

  fromStateValue(v) {
    return v !== void 0 ? !!v : void 0;
  }

  validate(v) {
    return v !== void 0 && typeof v !== 'boolean' && `'${v}' is not boolean`;
  }

  render() {
    const wrapperProps = Object.assign({}, this.props, {
      onReset: () => this.handleChange(void 0),
    });

    const inputProps = {
      className: 'st2-auto-form__checkbox',
      disabled: this.props.disabled,
      checked: this.state.value,
      onChange: (e) => this.handleChange(e.target.checked),
    };

    if (this.props.spec.default && this.state.value === void 0) {
      inputProps.className += ' ' + 'st2-auto-form__checkbox--default';
    }

    return (
      <BooleanFieldWrapper {...wrapperProps} >
        <input type='checkbox' {...inputProps} />
      </BooleanFieldWrapper>
    );
  }
}
