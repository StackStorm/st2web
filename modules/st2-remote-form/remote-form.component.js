import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import AutoForm from '@stackstorm/module-auto-form';
import AutoFormText from '@stackstorm/module-auto-form/modules/text';
import AutoFormCombobox from '@stackstorm/module-auto-form/modules/combobox';

import './style.less';

export default class RemoteForm extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    name: PropTypes.string.isRequired,
    disabled: PropTypes.bool.isRequired,
    spec: PropTypes.shape({
      enum: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        spec: PropTypes.object,
      })).isRequired,
    }).isRequired,
    data: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
  }

  static defaultProps = {
    disabled: false,
  }

  onChangeValue(value) {
    const { name } = this.props;
    const key = name === 'trigger' ? 'type' : 'ref';

    this.props.onChange({
      ...this.props.data,
      [key]: value,
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
    const { className, name, disabled, spec, data, onChange, ...props } = this.props;
    onChange;

    const key = name === 'trigger' ? 'type' : 'ref';

    const child = spec.enum.find(({ name }) => name === data[key]);
    const childSpec = child ? child.spec : {};

    return (
      <div {...props} className={cx('st2-remote-form', className)}>
        { disabled ? (
          <AutoFormText
            name={name}
            spec={spec}
            data={data[key]}
          />
        ) : (
          <AutoFormCombobox
            name={name}
            spec={spec}
            data={data[key]}
            onChange={(ref) => this.onChangeValue(ref)}
          />
        ) }
        <AutoForm
          spec={childSpec}
          data={data.parameters}
          disabled={disabled}
          onChange={(parameters) => this.onChangeParameters(parameters)}
        />
      </div>
    );
  }
}
