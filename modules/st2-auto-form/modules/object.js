import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import TextFieldModule from './text-field';

export default class ObjectModule extends React.Component {
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

      return new Error('You provided a `disabled: false` prop to an object-module without an `onChange` handler.');
    },
  }

  static defaultProps = {
    disabled: false,
  }

  onChange(value) {
    try {
      value = JSON.parse(value);
    }
    catch (e) {
      // error?
      value = null;
    }

    if (value) {
      this.props.onChange(value);
    }
  }

  render() {
    const { className = '', name, disabled, spec, data = {} } = this.props;

    return (
      <TextFieldModule
        className={cx('st2-form-object', className)}
        name={name}
        disabled={disabled}
        spec={spec}
        data={JSON.stringify(data, null, 2)}
        onChange={(value) => this.onChange(value)}
      />
    );
  }
}
