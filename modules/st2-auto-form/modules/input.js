import React from 'react';
import { PropTypes } from 'prop-types';

export default class AutoFormInput extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    disabled: PropTypes.bool,
    spec: PropTypes.object,
    data: PropTypes.string,
    onChange: PropTypes.func,
  }

  onChange(value) {
    const { spec } = this.props;

    if (spec.pattern) {
      if (!value.match(new RegExp(`/${spec.pattern}/`))) {
        // TODO: error
        return;
      }
    }

    this.props.onChange(value);
  }

  render() {
    const { name, disabled, spec, data } = this.props;

    return <div className="st2-form-input">
      <label className={`st2-auto-form__label ${ spec.required ? 'st2-auto-form--required' : '' }`}>
        <div className="st2-auto-form__title">
          { spec.name || name }
        </div>

        <input
          type="text"
          className="st2-auto-form__field"
          placeholder={ spec.default }
          required={ spec.required }
          disabled={ disabled }
          value={ data }
          onChange={ ({ target: { value } }) => this.onChange(value) }
        />
      </label>

      { spec.description
        ? <p className="st2-auto-form__description">
          { spec.description }
        </p>
        : null }
    </div>;
  }
}
