import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

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
    const { spec } = this.props;
    if (spec && spec.enum.some(({ name }) => name === value)) {
      this.onChoose(value);
    }
    else {
      this.setState({ value });
    }
  }

  onChoose(value) {
    this.setState({ value: null, error: null });
    this.props.onChange(value);
  }

  render() {
    const { className = '', name, disabled, spec, data = '' } = this.props;
    const { value } = this.state;

    const suggestions = !spec || value === null ? null : spec.enum.filter(({ name }) => name.includes(value));

    return (
      <div className={cx('st2-auto-form-combobox', className)} ref={(ref) => this.ref = ref}>
        <Label spec={spec}>
          <Title name={name} spec={spec} />

          <input
            type="text"
            className="st2-auto-form__field st2-auto-form__field--combo"
            placeholder={spec && spec.default || ''}
            required={spec && spec.required ? true : false}
            disabled={disabled}
            value={value === null ? data : value}
            onFocus={() => this.onFocus()}
            onBlur={(e) => this.onBlur(e)}
            onChange={({ target: { value } }) => this.onInput(value)}
            data-test={`field:${spec && spec.name || name}`}
          />

          <ErrorMessage>{ this.state.error }</ErrorMessage>
        </Label>

        { suggestions ? (
          <div className="st2-auto-form__suggestions">
            { suggestions.map(({ name, description }) => (
              <div
                key={name}
                className={cx('st2-auto-form__suggestion', { 'st2-auto-form__suggestion--active' : value === name })}
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
