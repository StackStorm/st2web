// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

//@flow

import React, { Component } from 'react';
import { PropTypes } from 'prop-types';

import ArrayField from '@stackstorm/module-auto-form/fields/array';
import IntegerField from '@stackstorm/module-auto-form/fields/integer';
import StringField from '@stackstorm/module-auto-form/fields/string';
import EnumField from '@stackstorm/module-auto-form/fields/enum';
import Button from '@stackstorm/module-forms/button.component';

import Property from './property';
import { specialProperties } from './parameter';

import style from './style.css';

export default class ParameterEditor extends Component<{
  parameter: Object,
  onChange: Function,
  onCancel: Function,
}, {
  parameter: Object,
}> {
  static propTypes = {
    parameter: PropTypes.object,
    onChange: PropTypes.func,
    onCancel: PropTypes.func,
  }

  constructor(props: Object) {
    super(props);

    this.state = {
      parameter: props.parameter || {},
    };
  }

  handleChange(key: string, value: string) {
    const { parameter } = this.state;

    parameter[key] = value;

    this.setState({ parameter });
  }

  style = style

  render() {
    const { onChange, onCancel } = this.props;
    const { parameter } = this.state;

    return (
      <form
        className={this.style.parameterForm}
        onSubmit={() => onChange(parameter)}
      >
        <div className={this.style.editorTitle}>
          { this.props.parameter ? 'Edit parameter' : 'New parameter' }
        </div>
        <StringField name="Name" spec={{ required: true }} value={parameter.name} onChange={value => this.handleChange('name', value)} />
        <EnumField name="Type" spec={{ required: true , enum: [ 'string', 'boolean', 'number', 'object', 'integer', 'array' ] }} value={parameter.type} onChange={value => this.handleChange('type', value)} />
        <StringField name="Description" value={parameter.description} onChange={value => this.handleChange('description', value)} />

        <ArrayField name="Enum" value={parameter.enum} onChange={value => this.handleChange('enum', value)} />
        <IntegerField name="Position" value={parameter.position} onChange={value => this.handleChange('position', value)} />
        <StringField name="Default" value={parameter.default} onChange={value => this.handleChange('default', value)} />
        {
          specialProperties.map(field => <Property key={field.name} {...field} value={parameter[field.name]} onChange={value => this.handleChange(field.name, value)} />)
        }
        <div className={this.style.editorFooter}>
          <Button submit value={this.props.parameter ? 'Update' : 'Add'} />
          <Button onClick={() => onCancel()} value="Cancel" />
        </div>
      </form>
    );
  }
}
