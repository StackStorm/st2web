import _ from 'lodash';
import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import ArrayField from './fields/array';
import NumberField from './fields/number';
import IntegerField from './fields/integer';
import BooleanField from './fields/boolean';
import StringField from './fields/string';
import ObjectField from './fields/object';
import PasswordField from './fields/password';
import EnumField from './fields/enum';

import './style.css';

export default class AutoForm extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    spec: PropTypes.object,
    data: PropTypes.object,
    disabled: PropTypes.bool.isRequired,
    onChange: PropTypes.func,
    flat: PropTypes.bool,
  }

  static defaultProps = {
    disabled: false,
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
        if (field.secret) {
          return PasswordField;
        }

        return StringField;
      case 'object':
        return ObjectField;
      default:
        return StringField;
    }
  }

  handleChange(name, value) {
    const { spec, data, onChange } = this.props;
    return onChange({
      ...getDefaults(spec),
      ...data,
      [name]: value,
    });
  }

  render() {
    const { spec, data, disabled, flat, className, ...props } = this.props;

    const fields = _(spec && spec.properties)
      .map((field, name) => {
        field._name = name;
        return field;
      })
      .reject('immutable')
      .sort((a, b) => {
        // If position exists for the items we're comparing then lets
        // favor sorting by that
        if (a.position || b.position) {
          // Some items might have position undefined. If it's undefined
          // it should be sorted behind an item with position defined
          if (a.position === undefined) {
            return 1;
          }
          if (b.position === undefined) {
            return -1;
          }
          // If both items have positon then the lower positon should come
          // first
          return a.position < b.position ? -1 : a.position > b.position ? 1 : 0;
        }
        // If required matches for both objects then we need to sort by other
        // criteria
        if(a.required === b.required) {
          // Sort items in alphabetical order
          return a._name < b._name ? -1 : a._name > b._name ? 1 : 0;
        }
        // Sort all required items first
        return a.required === b.required ? 0 : a.required ? -1 : 1;
      })
      .value()
    ;

    return (
      <div className={cx('st2-auto-form', flat && 'st2-auto-form--flat', className)} {...props}>
        { fields.map((field) => {
          const name = field._name;

          const FieldElement = this.getElementByField(field);

          return (
            <FieldElement
              key={name}
              name={name}
              spec={field}
              value={data && data[name]}
              disabled={disabled}
              onChange={(value) => this.handleChange(name, value)}
              data-test={`field:${name}`}
            />
          );
        }) }
      </div>
    );
  }
}

function getDefaults(spec) {
  const defaults = {};

  Object.keys(spec.properties).forEach((key) => {
    const property = spec.properties[key];
    if (property.default !== undefined && property.enum) {
      defaults[key] = property.default;
    }
  });

  return defaults;
}
