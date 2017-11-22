import React from 'react';
import { PropTypes } from 'prop-types';

export default class AutoFormCombobox extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    disabled: PropTypes.bool,
    spec: PropTypes.object,
    data: PropTypes.string,
    onChange: PropTypes.func,
  }

  state = {
    value: null,
  }

  onFocus() {
    this.setState({ value: this.props.data });
  }

  onBlur() {
    // HACK: When clicking an item, onBlur is run before the click target is found,
    // so the onClick is not run because the item is removed first.
    setTimeout(() => {
      this.setState({ value: null });
    }, 100);
  }

  onInput(value) {
    this.setState({ value });
  }

  onChoose(value) {
    this.setState({ value: null });
    this.props.onChange(value);
  }

  render() {
    const { name, disabled, spec, data } = this.props;
    const { value } = this.state;

    const suggestions = value === null ? null : spec.enum.filter(({ name }) => name.includes(value));

    return <div className="st2-auto-form-combobox">
      <label className={`st2-auto-form__label ${ spec.required ? 'st2-auto-form--required' : '' }`}>
        <div className="st2-auto-form__title">
          { spec.name || name }
        </div>

        <input
          type="text"
          className="st2-auto-form__field st2-auto-form__field--combo"
          placeholder={ spec.default }
          required={ spec.required }
          disabled={ disabled }
          value={ value === null ? data : value }
          onFocus={ () => this.onFocus() }
          onBlur={ () => this.onBlur() }
          onChange={ ({ target: { value } }) => this.onInput(value) }
        />
      </label>

      { suggestions
        ? <div className="st2-auto-form__suggestions">
          { suggestions.map(({ name, description }) => {
            return <div
              key={ name }
              className={`st2-auto-form__suggestion ${ false ? 'st2-auto-form__suggestion--active' : '' }`}
              onClick={ () => this.onChoose(name) }
            >
              <div className="st2-auto-form__suggestion-primary">{ name }</div>
              <div className="st2-auto-form__suggestion-secondary">{ description }</div>
            </div>;
          }) }
        </div>
        : null }

      { spec.description
        ? <p className="st2-auto-form__description">
          { spec.description }
        </p>
        : null }
    </div>;
  }
}
