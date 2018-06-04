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
    selected: null,
  }

  componentDidMount() {
    this._listener = (event) => {
      const { spec } = this.props;
      const { value } = this.state;
      const suggestions = this.getSuggestions(spec, value);

      if (!suggestions || !suggestions.length) {
        return;
      }

      if (event.key === 'ArrowDown') {
        let selected = suggestions.findIndex(({ name }) => name === this.state.selected);
        selected = selected + 1;

        if (selected < suggestions.length) {
          selected = suggestions[selected].name;
          this.setState({ selected });
        }
      }

      if (event.key === 'ArrowUp') {
        let selected = suggestions.findIndex(({ name }) => name === this.state.selected);
        selected = selected - 1;

        if (selected >= 0) {
          selected = suggestions[selected].name;
          this.setState({ selected });
        }
      }

      if (event.key === 'Enter') {
        const selected = this.state.selected || suggestions[0].name;
        this.onChoose(selected);
      }

      if (event.key === 'Escape') {
        this.onBlur();
      }
    };

    document.addEventListener('keydown', this._listener, false);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this._listener, false);
    delete this._listener;
  }

  onFocus() {
    this.setState({ value: this.props.data });
  }

  onBlur(e) {
    const { value } = this.state;

    if (value === null) {
      return;
    } 

    this.setState({ value: null });
    this.props.onChange(value);
  }

  onInput(value) {
    const { spec } = this.props;
    if (spec && spec.enum.some(({ name }) => name === value)) {
      this.onChoose(value);
    }
    else {
      this.setState({
        value,
        selected: null,
      });
    }
  }

  onChoose(value) {
    this.setState({ value, error: null });
  }

  getSuggestions(spec, value) {
    if (!spec || value === null) {
      return null;
    }

    return spec.enum.filter(({ name }) => name.includes(value));
  }

  render() {
    const { className = '', name, disabled, spec, data = '' } = this.props;
    const { value, selected } = this.state;

    const suggestions = this.getSuggestions(spec, value);

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

        { suggestions && suggestions.length ? (
          <div className="st2-auto-form__suggestions">
            { suggestions.map(({ name, description }) => (
              <div
                key={name}
                className={cx('st2-auto-form__suggestion', {
                  'st2-auto-form__suggestion--active': name === value,
                  'st2-auto-form__suggestion--selected': name === selected,
                })}
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
