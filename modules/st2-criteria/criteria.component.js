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
  'search': 'Search',
};

const searchConditions = {
  'any': 'Any',
  'all': 'All',
  'any2any': 'Any2Any',
  'all2any': 'All2Any',
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

  handleChangeSearchCondition(key, condition) {
    const { data, onChange } = this.props;

    return onChange({
      ...data,
      [key]: {
        ...data[key],
        condition,
      },
    });
  }


  handleChangeSearchItemKey(key, oldItemKey, itemKey) {
    const { onChange } = this.props;

    if(oldItemKey !== itemKey) {
      const data = { ...this.props.data };
      const dataItem = { ...data[key].pattern };
      delete dataItem[oldItemKey];

      return onChange({
        ...data,
        [key]: {
          ...data[key],
          pattern: {
            ...dataItem,
            [itemKey]: {
              ...data[key].pattern[oldItemKey],
            },
          },
        },
      });
    }
    return onChange(this.props.data);
    
  }

  handleChangeSearchPattern(key, itemKey, pattern) {
    const { data, onChange } = this.props;

    return onChange({
      ...data,
      [key]: {
        ...data[key],
        pattern: {
          ...data[key].pattern,
          [itemKey]: {
            ...data[key].pattern[itemKey],
            pattern,
          },
        },
      },
    });
  }

  handleChangeSearchType(key, itemKey, type) {
    const { data, onChange } = this.props;

    return onChange({
      ...data,
      [key]: {
        ...data[key],
        pattern: {
          ...data[key].pattern,
          [itemKey]: {
            ...data[key].pattern[itemKey],
            type,
          },
        },
      },
    });
  }

  handleAddSearchPatternItem(key) {
    const { data, onChange } = this.props;

    return onChange({
      ...data,
      [key]: {
        ...data[key],
        pattern: {
          ...data[key].pattern,
          ['']: {
            type: Object.keys(types)[0],
          },
        },
      },
    });
  }

  handleRemoveSearchPatternItem(key, itemKey) {
    const { onChange } = this.props;

    const data = { ...this.props.data };
    const dataPattern = {...this.props.data[key].pattern};
    delete dataPattern[itemKey];

    return onChange({
      ...data,
      [key]: {
        ...data[key],
        pattern: {
          ...dataPattern,
        },
      },
    });
  }

  handleChangeKey(oldKey, key) {
    const { onChange } = this.props;

    if(oldKey!== key) {
      const data = { ...this.props.data };
      delete data[oldKey];
  
      return onChange({
        ...data,
        [key]: this.props.data[oldKey],
      });
    }
    return onChange(this.props.data);
  }

  handleChangeType(key, type) {
    const { data, onChange } = this.props;

    if (type === 'search') {
      // save default values for search criteria
      return onChange({
        ...data,
        [key]: {
          ...data[key],
          type,
          condition: 'all',
          pattern: {
            ['']: {
              type: Object.keys(types)[0],
            },
          },
        },
      });
    }
    else {
      // reset pattern from object to empty string if type != 'search'
      this.handleChangePattern(key, '');
      return onChange({
        ...data,
        [key]: {
          ...data[key],
          type,
          pattern: '',
        },
      });
    }
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
          { _.map(data, ({ type, pattern, condition }, key) => (
            <div className={style.line} key={key}>
              <div className={style.criteriaLabel}>
                <AutoFormCombobox
                  name='Key'
                  className={style.entity}
                  disabled={disabled}
                  data={key}
                  spec={spec}
                  onChange={(value) => this.handleChangeKey(key, value)}
                />
                { disabled ? null :
                  <i className={cx('icon-cross', style.remove)} onClick={() => this.handleRemove(key)} />
                }
              </div>
              <AutoFormSelect
                name='Type'
                className={style.entity}
                disabled={disabled}
                data={type}
                spec={{
                  required: true,
                  enum: types,
                }}
                onChange={(value) => this.handleChangeType(key, value)}
              />
              { type === 'search' ? (
                <>
                  <AutoFormSelect
                    name='Condition'
                    className={style.entity}
                    disabled={disabled}
                    data={condition}
                    spec={{
                      required: true,
                      enum: searchConditions,
                    }}
                    onChange={(value) => this.handleChangeSearchCondition(key, value)}
                  />
                  <div className={style.break} />
                  <h5>Search Patterns <i className={cx('icon-plus', style.remove)} onClick={() => this.handleAddSearchPatternItem(key)} /></h5>
                  <div className={style.break} />
                  { _.map(pattern, ({ type, pattern }, itemKey) => (
                    <div style={{display: 'flex'}} key={itemKey}>
                      <AutoFormCombobox
                        name={'Item name'}
                        className={style.entity}
                        disabled={disabled}
                        data={itemKey}
                        spec={{
                          required: true,
                          enum: [],
                        }}
                        onChange={(value) => this.handleChangeSearchItemKey(key, itemKey, value)}
                      />
                      <AutoFormSelect
                        name={'Type'}
                        className={style.entity}
                        disabled={disabled}
                        data={type}
                        spec={{
                          required: true,
                          enum: types,
                        }}
                        onChange={(value) => this.handleChangeSearchType(key, itemKey, value)}
                      />
                      <AutoFormInput
                        name={'Pattern'}
                        className={style.entity}
                        disabled={disabled}
                        data={pattern || ''}
                        spec={{
                          required: true,
                        }}
                        onChange={(value) => this.handleChangeSearchPattern(key, itemKey, value)}
                      />
                      <i
                        className={cx('icon-cross', style.remove, style.subPatternRemove)} onClick={() => this.handleRemoveSearchPatternItem(key, itemKey)}
                      />
                    </div>
                  ))}
                </>
              ) : (
                <AutoFormInput
                  name={'Pattern'}
                  className={style.entity}
                  disabled={disabled}
                  data={pattern}
                  spec={{
                    required: true,
                  }}
                  onChange={(value) => this.handleChangePattern(key, value)}
                />
              )}              
            </div>
          )) }
        </div>
        { disabled ? null : (
          <div className={style.buttons}>
            <input
              type='button'
              className='st2-forms__button st2-forms__button--small'
              onClick={() => this.handleAdd()}
              value='Add criteria'
            />
          </div>
        ) }
      </div>
    );
  }
}
