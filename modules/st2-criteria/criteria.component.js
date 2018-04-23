import _ from 'lodash';
import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import AutoFormCombobox from '@stackstorm/module-auto-form/modules/combobox';
import AutoFormSelect from '@stackstorm/module-auto-form/modules/select';
import AutoFormInput from '@stackstorm/module-auto-form/modules/input';

import './style.less';

const types = {
  'regex': 'Regular expression match',
  'iregex': 'Case-insensitive regular expression match',
  'matchwildcard': 'Wildcard match',
  'eq': 'Equals',
  'equals': 'Equals',
  'nequals': 'Not Equals',
  'neq': 'Not Equals',
  'ieq': 'Equals Case Insensitive',
  'iequals': 'Equals Case Insensitive',
  'contains': 'Contains',
  'icontains': 'Contains Case Insensitive',
  'ncontains': 'Not Contains',
  'incontains': 'Not Contains Case Insensitive',
  'startswith': 'Starts With',
  'istartswith': 'Starts With Case Insensitive',
  'endswith': 'Ends With',
  'iendswith': 'Ends With Case Insensitive',
  'lt': 'Less Than',
  'lessthan': 'Less Than',
  'gt': 'Greater Than',
  'greaterthan': 'Greater Than',
  'td_lt': 'Earlier Than',
  'timediff_lt': 'Earlier Than',
  'td_gt': 'Later Than',
  'timediff_gt': 'Later Than',
  'exists': 'Exists',
  'nexists': 'Doesn\'t Exist',
};

export default class Criteria extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    spec: PropTypes.object,
    data: PropTypes.object,
    disabled: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
    flat: PropTypes.bool,
  }

  static defaultProps = {
    disabled: false,
  }

  handleChangeKey(oldKey, key) {
    const { onChange } = this.props;

    const data = { ...this.props.data };
    delete data[oldKey];

    return onChange({
      ...data,
      [key]: this.props.data[oldKey],
    });
  }

  handleChangeType(key, type) {
    const { data, onChange } = this.props;

    return onChange({
      ...data,
      [key]: {
        ...data[key],
        type,
      },
    });
  }

  handleChangePattern(key, pattern) {
    const { data, onChange } = this.props;

    return onChange({
      ...data,
      [key]: {
        ...data[key],
        pattern,
      },
    });
  }

  handleRemove(oldKey) {
    const { onChange } = this.props;

    const data = { ...this.props.data };
    delete data[oldKey];

    return onChange(data);
  }

  handleAdd() {
    const { data, onChange } = this.props;

    return onChange({
      ...data,
      '': {
        type: '',
        pattern: '',
      },
    });
  }

  render() {
    const { className, spec, data, disabled, onChange, flat, ...props } = this.props;
    onChange;

    return (
      <div {...props} className={cx('st2-criteria', flat && [ 'st2-auto-form--flat', 'flat' ], className)}>
        <div>
          { _.map(data, ({ type, pattern }, key) => (
            <div className="st2-criteria__line" key={key}>
              <AutoFormCombobox
                className="st2-criteria__entity"
                disabled={disabled}
                data={key}
                spec={spec}
                onChange={(value) => this.handleChangeKey(key, value)}
              />
              <AutoFormSelect
                className="st2-criteria__entity"
                disabled={disabled}
                data={type}
                spec={{
                  required: true,
                  enum: types,
                }}
                onChange={(value) => this.handleChangeType(key, value)}
              />
              <AutoFormInput
                className="st2-criteria__entity"
                disabled={disabled}
                data={pattern}
                spec={{
                  required: true,
                }}
                onChange={(value) => this.handleChangePattern(key, value)}
              />
              { disabled ? null :
                <i className="icon-cross st2-criteria__remove" onClick={() => this.handleRemove(key)} />
              }
            </div>
          )) }
        </div>
        { disabled ? null : (
          <div className="st2-criteria__buttons">
            <input
              type="button"
              className="st2-forms__button st2-forms__button--small"
              onClick={() => this.handleAdd()}
              value="Add criteria"
            />
          </div>
        ) }
      </div>
    );
  }
}
