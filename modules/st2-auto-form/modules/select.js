import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import {
  Label,
  Title,
  ErrorMessage,
  Description,
} from '../wrappers';

export default class SelectModule extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    name: PropTypes.string,
    disabled: PropTypes.bool.isRequired,
    spec: PropTypes.object,
    data: PropTypes.string,
    onChange: function (props, propName, componentName) {
      if (props.disabled) {
        return null;
      }

      if (props[propName]) {
        return PropTypes.checkPropTypes({
          [propName]: PropTypes.func,
        }, props, propName, componentName);
      }

      return new Error('You provided a `disabled: false` prop to a select-module without an `onChange` handler.');
    },
  }

  static defaultProps = {
    disabled: false,
  }

  state = {
    error: null,
  }

  onChange(value) {
    this.state.error && this.setState({ error: null });
    this.props.onChange(value);
  }

  render() {
    const { className = '', name, disabled, spec, data = '' } = this.props;
    const options = Array.isArray(spec.enum)
      ? spec.enum
      : Object.keys(spec.enum).map((value) => ({ value, label: `${spec.enum[value]} (${value})` }))
    ;

    return (
      <div className={cx('st2-auto-form-select', className)}>
        <Label spec={spec} className="st2-auto-form__select">
          <Title name={name} spec={spec} />

          <select
            className="st2-auto-form__field"
            required={spec.required}
            disabled={disabled}
            onChange={({ target: { value } }) => this.onChange(value)}
            value={data}
            data-test={`field:${name}`}
          >
            { options.map(({ value, label }) => (
              <option
                key={value}
                value={value}
                label={label}
              >
                { label }
              </option>
            )) }
          </select>

          <ErrorMessage>{ this.state.error }</ErrorMessage>
        </Label>

        <Description spec={spec} />
      </div>
    );
  }
}
