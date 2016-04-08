import _ from 'lodash';
import React from 'react';

import ArrayField from './fields/array';
import NumberField from './fields/number';
import IntegerField from './fields/integer';
import BooleanField from './fields/boolean';
import StringField from './fields/string';
import ObjectField from './fields/object';

class AutoForm extends React.Component {
  static propTypes = {
    spec: React.PropTypes.object,
    ngModel: React.PropTypes.object,
    disabled: React.PropTypes.bool,
    onChange: React.PropTypes.func
  }

  getElementByField(field) {
    switch (field.type) {
      case 'array':
        return ArrayField;
      case 'number':
        return NumberField;
      case 'integer':
        return IntegerField;
      case 'boolean':
        return BooleanField;
      case 'string':
        return StringField;
      case 'object':
        return ObjectField;
      default:
        return StringField;
    }
  }

  getValue() {
    return _.mapValues(this.refs, v => v.getValue());
  }

  handleChange(name, value) {
    const { onChange } = this.props;
    return onChange && onChange(name, value);
  }

  render() {
    const { spec, ngModel, disabled } = this.props;

    return <div>
      {
        _.map(spec && spec.properties, (field, name) => {
          const props = {
            name: name,
            spec: field,
            value: ngModel && ngModel[name],
            disabled: disabled,
            onChange: (value) => this.handleChange(name, value)
          };

          const FieldElement = this.getElementByField(field);

          return <FieldElement key={name} ref={name} {...props} />;
        })
      }
    </div>;
  }
}

module.exports = AutoForm;
