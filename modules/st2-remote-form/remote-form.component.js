import React from 'react';
import { PropTypes } from 'prop-types';

// import StringField from '@stackstorm/module-auto-form/fields/string';

import './style.less';

export default class RemoteForm extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    disabled: PropTypes.bool,
    spec: PropTypes.object,
    data: PropTypes.object,
    onChange: PropTypes.func,
  }

  render() {
    const { name, disabled, spec, data, onChange } = this.props;
    const value = name === 'trigger' ? data.type : data.ref;

    const child = spec.enum.find(({ name }) => name === value);
    const childSpec = child ? child.spec : {};

    return <div className="st2-remote-form">
      {
        disabled
          ? <div className="st2-form-text"
            name={name}
            data-spec={spec}
            data={value}
          />
          : <div className="st2-manual-form st2-form-combobox"
            name={name}
            data-spec={spec}
            data={value}
            onChange={(ref) => console.log('changed', ref)}
          />
      }
      <div className="st2-auto-form"
        key={value}
        disabled={disabled}
        data-spec={childSpec}
        data-watch-depth="reference"
        data={data.parameters}
        onChange={onChange}
      />
    </div>;
  }
}
