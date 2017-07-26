import _ from 'lodash';
import React from 'react';

import ArrayField from './fields/array';
import NumberField from './fields/number';
import IntegerField from './fields/integer';
import BooleanField from './fields/boolean';
import StringField from './fields/string';
import ObjectField from './fields/object';
import EnumField from './fields/enum';

export default class AutoForm extends React.Component {
  static propTypes = {
    key: React.PropTypes.string,
    spec: React.PropTypes.object,
    ngModel: React.PropTypes.object,
    disabled: React.PropTypes.bool,
    onChange: React.PropTypes.func
  }

  getElementByField(field) {
    if (field.enum) {
      return EnumField;
    }
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

    const fields = _(spec && spec.properties)
      .map((field, name) => {
        field._name = name;
        return field;
      })
      .reject('immutable')
      .sort(
        (a, b) => {
          // If position exists for the items we're comparing then lets
          // favor sorting by that
          if (a.position || b.position){
            // Some items might have position undefined. If it's undefined
            // it should be sorted behind an item with position defined
            if (a.position === undefined){
              return 1;
            }
            if (b.position === undefined){
              return -1;
            }
            // If both items have positon then the lower positon should come
            // first
            return a.position < b.position ? -1 : a.position > b.position ? 1 : 0;
          }
          // If required matches for both objects then we need to sort by other
          // criteria
          if(a.required === b.required){
            // Sort items in alphabetical order
            return a._name < b._name ? -1 : a._name > b._name ? 1 : 0;
          }
          // Sort all required items first
          return a.required === b.required ? 0 : a.required ? -1 : 1;
        }
      )
      .value();

    return <div>
      {
        fields.map(field => {
          const name = field._name;
          const props = {
            name: name,
            spec: field,
            value: ngModel && ngModel[name],
            disabled: disabled,
            onChange: (value) => this.handleChange(name, value),
            'data-test': `field:${name}`
          };

          const FieldElement = this.getElementByField(field);

          return <FieldElement key={name} ref={name} {...props} />;
        })
      }
    </div>;
  }
}
