import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import AutoForm from '@stackstorm/module-auto-form';
import AutoFormLink from '@stackstorm/module-auto-form/modules/link';
import AutoFormCombobox from '@stackstorm/module-auto-form/modules/combobox';

import './style.less';

export default class RemoteForm extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    name: PropTypes.string.isRequired,
    disabled: PropTypes.bool.isRequired,
    spec: PropTypes.shape({
      enum: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        spec: PropTypes.object,
      })).isRequired,
    }).isRequired,
    data: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    flat: PropTypes.bool,
  }

  static defaultProps = {
    disabled: false,
  }

  onChangeValue(value) {
    const { spec: { name } } = this.props;

    this.props.onChange({
      ...this.props.data,
      [name]: value,
      parameters: {},
    });
  }

  onChangeParameters(parameters) {
    this.props.onChange({
      ...this.props.data,
      parameters,
    });
  }

  render() {
    const { className, name, disabled, spec, data, onChange, flat, ...props } = this.props;
    onChange;

    const child = spec.enum.find(({ name }) => name === data[spec.name]);
    const childSpec = child ? child.spec : {};

    return (
      <div {...props} className={cx('st2-remote-form', flat && 'st2-auto-form--flat', className)}>
        { disabled ? (
          <AutoFormLink
            name={name}
            href={`/actions/${data[name]}`}
            spec={spec}
            data={data[spec.name]}
            flat={flat}
          />
        ) : (
          <AutoFormCombobox
            name={name}
            spec={spec}
            data={data[spec.name]}
            onChange={(ref) => this.onChangeValue(ref)}
            flat={flat}
          />
        ) }
        <AutoForm
          spec={childSpec}
          data={data.parameters}
          disabled={disabled}
          onChange={(parameters) => this.onChangeParameters(parameters)}
          flat={flat}
        />
      </div>
    );
  }
}
