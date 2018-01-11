import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import TextFieldModule from './text-field';

export default class ObjectModule extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    name: PropTypes.string,
    disabled: PropTypes.bool,
    spec: PropTypes.object,
    data: PropTypes.string,
    onChange: PropTypes.func,
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
