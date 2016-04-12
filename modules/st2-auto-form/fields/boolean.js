import React from 'react';

import { BaseTextField } from './base';
import { BooleanFieldWrapper } from '../wrappers';

export default class BooleanField extends BaseTextField {
  toStateValue(v) {
    return v !== void 0 ? !!v : void 0;
  }

  fromStateValue(v) {
    return !!v;
  }

  validate(v) {
    return typeof v !== 'boolean' && `'${v}' is not boolean`;
  }

  render() {
    const inputProps = {
      className: 'st2-auto-form__checkbox',
      disabled: this.props.disabled,
      checked: this.state.value,
      onChange: (e) => this.handleChange(e.target.checked)
    };

    return <BooleanFieldWrapper {...this.props} >
      <input type='checkbox' {...inputProps} />
    </BooleanFieldWrapper>;
  }
}
