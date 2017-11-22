import React from 'react';
import { PropTypes } from 'prop-types';

export default class AutoFormSelect extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    disabled: PropTypes.bool,
    spec: PropTypes.object,
    data: PropTypes.string,
    onChange: PropTypes.func,
  }

  onChange(value) {
    this.props.onChange(value);
  }

  render() {
    const { name, disabled, spec, data } = this.props;
    const options = Array.isArray(spec.enum)
      ? spec.enum
      : Object.keys(spec.enum).map((key) => `${spec.enum[key]} (${key})`)
    ;

    return <div className="st2-auto-form-select">
      <label className={`st2-auto-form__label ${ spec.required ? 'st2-auto-form--required' : '' }`}>
        <div className="st2-auto-form__title">
          { spec.name || name }
        </div>

        <select
          className="st2-auto-form__field"
          required={ spec.required }
          disabled={ disabled }
          onChange={ ({ target: { value } }) => this.onChange(value) }
        >
          { options.map(({ value, label }) => {
            return <option
              key={ value }
              value={ value }
              label={ label }
              selected={ value === data }
            >{ label }</option>;
          }) }
        </select>
      </label>

      { spec.description
        ? <p className="st2-auto-form__description">
          { spec.description }
        </p>
        : null }
    </div>;
  }
}
