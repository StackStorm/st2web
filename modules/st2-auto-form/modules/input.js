import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import {
  Label,
  Title,
  ErrorMessage,
  Description,
} from '../wrappers';

export default class InputModule extends React.Component {
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

      return new Error('You provided a `disabled: false` prop to an input-module without an `onChange` handler.');
    },
  }

  static defaultProps = {
    disabled: false,
  }

  state = {
    error: null,
  }

  onChange(value) {
    const { spec } = this.props;

    if (spec.pattern) {
      if (!value.match(new RegExp(`/${spec.pattern}/`))) {
        this.setState({ error: `The value must match "${spec.pattern}".` });
        return;
      }
    }

    this.state.error && this.setState({ error: null });
    this.props.onChange(value);
  }

  render() {
    const { className = '', name, disabled, spec, data = '' } = this.props;

    return (
      <div className={cx('st2-form-input', className)}>
        <Label spec={spec}>
          <Title name={name} spec={spec} />

          <input
            type="text"
            className="st2-auto-form__field"
            placeholder={spec.default}
            required={spec.required}
            disabled={disabled}
            value={data}
            onChange={({ target: { value } }) => this.onChange(value)}
            data-test={`field:${name}`}
          />

          <ErrorMessage>{ this.state.error }</ErrorMessage>
        </Label>

        <Description spec={spec} />
      </div>
    );
  }
}
