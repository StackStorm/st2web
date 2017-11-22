import React from 'react';
import { PropTypes } from 'prop-types';

export default class AutoFormCheckbox extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    disabled: PropTypes.bool,
    spec: PropTypes.object,
    data: PropTypes.bool,
    onChange: PropTypes.func,
  }

  onChange(value) {
    this.props.onChange(value);
  }

  render() {
    const { name, disabled, spec, data } = this.props;

    return <div className="st2-form-checkbox">
      <label className={`st2-auto-form__label ${ spec.required ? 'st2-auto-form--required' : '' }`}>
        <input
          type="checkbox"
          className="st2-auto-form__checkbox"
          placeholder={ spec.default }
          disabled={ disabled }
          checked={ data }
          onChange={ ({ target: { checked } }) => this.onChange(checked) }
        />

        <div className="st2-auto-form__title">
          { spec.name || name }
        </div>
      </label>

      { spec.description
        ? <p className="st2-auto-form__description">
          { spec.description }
        </p>
        : null }
    </div>;
  }
}
