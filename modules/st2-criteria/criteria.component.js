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

import _ from 'lodash';
import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import AutoFormCombobox from '@stackstorm/module-auto-form/modules/combobox';
import AutoFormSelect from '@stackstorm/module-auto-form/modules/select';
import AutoFormInput from '@stackstorm/module-auto-form/modules/input';

import style from './style.css';

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
      <div {...props} className={cx(style.component, flat && [ 'st2-auto-form--flat', style.flat ], className)}>
        <div>
          { _.map(data, ({ type, pattern }, key) => (
            <div className={style.line} key={key}>
              <AutoFormCombobox
                className={style.entity}
                disabled={disabled}
                data={key}
                spec={spec}
                onChange={(value) => this.handleChangeKey(key, value)}
              />
              <AutoFormSelect
                className={style.entity}
                disabled={disabled}
                data={type}
                spec={{
                  required: true,
                  enum: types,
                }}
                onChange={(value) => this.handleChangeType(key, value)}
              />
              <AutoFormInput
                className={style.entity}
                disabled={disabled}
                data={pattern}
                spec={{
                  required: true,
                }}
                onChange={(value) => this.handleChangePattern(key, value)}
              />
              { disabled ? null :
                <i className={cx('icon-cross', style.remove)} onClick={() => this.handleRemove(key)} />
              }
            </div>
          )) }
        </div>
        { disabled ? null : (
          <div className={style.buttons}>
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
