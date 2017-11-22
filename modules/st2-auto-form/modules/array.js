import React from 'react';
import { PropTypes } from 'prop-types';

import AutoFormInput from './input';

export default class ArrayModule extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    disabled: PropTypes.bool,
    spec: PropTypes.object,
    data: PropTypes.arrayOf(PropTypes.string),
    onChange: PropTypes.func,
  }

  onChange(value) {
    value = value.split(',').map(v => v.trim()).filter(v => v);

    this.props.onChange(value);
  }

  render() {
    const { name, disabled, spec, data } = this.props;

    return <AutoFormInput
      name={ name }
      disabled={ disabled }
      spec={ spec }
      data={ data.join(', ') }
      onChange={ (value) => this.onChange(value) }
    />;
  }
}
