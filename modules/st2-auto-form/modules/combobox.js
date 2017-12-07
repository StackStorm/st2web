import React from 'react';
import { PropTypes } from 'prop-types';

import {
  Label,
  Title,
  ErrorMessage,
  Description,
} from '../wrappers';

export default class ComboboxModule extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    name: PropTypes.string,
    disabled: PropTypes.bool,
    spec: PropTypes.object,
    data: PropTypes.string,
    onChange: PropTypes.func,
  }

  state = {
    value: null,
    error: null,
  }

  onFocus() {
    this.setState({ value: this.props.data });
  }

  onBlur(e) {
    if (this.state.value !== 'null') {
      this.setState({ value: null });
    }
  }

  onInput(value) {
    this.setState({ value });
  }

  onChoose(value) {
    this.setState({ value: null, error: null });
    this.props.onChange(value);
  }

  render() {
    const { className = '', name, disabled, spec, data = '' } = this.props;
    const { value } = this.state;

    const suggestions = value === null ? null : spec.enum.filter(({ name }) => name.includes(value));

    return (
      <div className={`st2-auto-form-combobox ${className}`} ref={(ref) => this.ref = ref}>
        <Label spec={spec}>
          <Title name={name} spec={spec} />

          <input
            type="text"
            className="st2-auto-form__field st2-auto-form__field--combo"
            placeholder={spec.default}
            required={spec.required}
            disabled={disabled}
            value={value === null ? data : value}
            onFocus={() => this.onFocus()}
            onBlur={(e) => this.onBlur(e)}
            onChange={({ target: { value } }) => this.onInput(value)}
          />

          <ErrorMessage>{ this.state.error }</ErrorMessage>
        </Label>

        { suggestions ? (
          <div className="st2-auto-form__suggestions">
            { suggestions.map(({ name, description }) => (
              <div
                key={name}
                className={`st2-auto-form__suggestion ${value === name ? 'st2-auto-form__suggestion--active' : ''}`}
                onMouseDown={() => this.onChoose(name)}
              >
                <div className="st2-auto-form__suggestion-primary">{ name }</div>
                <div className="st2-auto-form__suggestion-secondary">{ description }</div>
              </div>
            )) }
          </div>
        ) : null }

        <Description spec={spec} />
      </div>
    );
  }
}
