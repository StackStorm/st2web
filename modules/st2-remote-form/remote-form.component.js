import React from 'react';
import { PropTypes } from 'prop-types';

import AutoForm from '@stackstorm/module-auto-form';
import AutoFormText from '@stackstorm/module-auto-form/modules/text';
import AutoFormCombobox from '@stackstorm/module-auto-form/modules/combobox';

import './style.less';

export default class RemoteForm extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    disabled: PropTypes.bool,
    spec: PropTypes.object,
    data: PropTypes.object,
    onChange: PropTypes.func,
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
    const { name, disabled, spec, data } = this.props;
    const key = name === 'trigger' ? 'type' : 'ref';

    const child = spec.enum.find(({ name }) => name === data[key]);
    const childSpec = child ? child.spec : {};

    return <div className="st2-remote-form">
      {
        disabled
          ? <AutoFormText
            name={name}
            spec={spec}
            data={data[key]}
          />
          : <AutoFormCombobox
            name={name}
            spec={spec}
            data={data[key]}
            onChange={(ref) => this.onChangeValue(ref)}
          />
      }
      <AutoForm
        spec={childSpec}
        ngModel={data.parameters}
        disabled={disabled}
        onChange={(parameters) => this.onChangeParameters(parameters)}
      />
    </div>;
  }
}
