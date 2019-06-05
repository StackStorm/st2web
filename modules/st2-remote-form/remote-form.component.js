// Copyright 2019 Extreme Networks, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import AutoForm from '@stackstorm/module-auto-form';
import AutoFormLink from '@stackstorm/module-auto-form/modules/link';
import AutoFormCombobox from '@stackstorm/module-auto-form/modules/combobox';

import './style.css';

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
