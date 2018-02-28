import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import AutoFormInput from './input';

export default class ArrayModule extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    name: PropTypes.string,
    disabled: PropTypes.bool.isRequired,
    spec: PropTypes.object,
    data: PropTypes.arrayOf(PropTypes.string),
    onChange: function (props, propName, componentName) {
      if (props.disabled) {
        return null;
      }

      if (props[propName]) {
        return PropTypes.checkPropTypes({
          [propName]: PropTypes.func,
        }, props, propName, componentName);
      }

      return new Error('You provided a `disabled: false` prop to an array-module without an `onChange` handler.');
    },
  }

  static defaultProps = {
    disabled: false,
  }

  onChange(value) {
    value = value.split(',').map((v) => v.trim()).filter((v) => v);

    this.props.onChange(value);
  }

  render() {
    const { className = '', name, disabled, spec, data = [] } = this.props;

    return (
      <AutoFormInput
        className={cx('st2-form-array', className)}
        name={name}
        disabled={disabled}
        spec={spec}
        data={data.join(', ')}
        onChange={(value) => this.onChange(value)}
      />
    );
  }
}
