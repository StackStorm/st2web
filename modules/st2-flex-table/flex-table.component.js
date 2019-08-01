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

import get from 'lodash/fp/get';
import update from 'lodash/fp/update';
import map from 'lodash/fp/map';

import { actions } from './flex-table.reducer';

import './style.css';

export class FlexTable extends React.Component {
  static actions = actions

  static propTypes = {
    className: PropTypes.string,
    uid: PropTypes.string,
    title: PropTypes.node,
    titleType: PropTypes.string,
    note: PropTypes.node,
    collapsed: PropTypes.bool.isRequired,
    children: PropTypes.node,
    icon: PropTypes.node,
    onToggle: PropTypes.func,
  }

  static defaultProps = {
    collapsed: false,
  }

  render() {
    const { className, uid, title, titleType, note, collapsed, children, icon, onToggle, ...props } = this.props;
    uid;

    return (
      <div {...props} className={cx('st2-flex-table', className, { 'st2-flex-table--collapsed': collapsed })}>
        { title ? (
          <FlexTableTitle
            type={titleType}
            icon={icon}
            onToggle={(e) => onToggle(e)}
            title={title}
            note={note}
          />
        ) : null  }

        { collapsed ? null : children }
      </div>
    );
  }
}

export class FlexTableTitle extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    type: PropTypes.string,
    icon: PropTypes.node,
    onToggle: PropTypes.func.isRequired,
    title: PropTypes.node,
    note: PropTypes.node,
  }

  render() {
    const { className, children, type, icon, onToggle, title, note, ...props } = this.props;

    return (
      <div
        {...props}
        className={cx('st2-flex-table__caption', className, {
          'st2-flex-table__caption--pack': icon,
          [`st2-flex-table__caption--${type}`]: type,
        })}
        onClick={(e) => onToggle(e)}
      >
        { typeof icon === 'string' ? (
          <img src={icon} />
        ) : (
          icon || null
        ) }

        <h2 className="st2-flex-table__caption-title">{ title }</h2>

        { note ? (
          <h4 className="st2-flex-table__caption-note">{ note }</h4>
        ) : null }

        { children }
      </div>
    );
  }
}

export class FlexTableRow extends React.Component {
  static actions = actions

  static propTypes = {
    className: PropTypes.string,
    columns: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string,
      children: PropTypes.node,
    })),
    children: PropTypes.node,
  }

  render() {
    const { className, columns=[], children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-flex-table__row', className)}>
        { columns.map(({ Component = 'div', className, children, ...props }, key) => (
          <Component {...props} key={key} className={cx('st2-flex-table__column', className)}>
            { children }
          </Component>
        )) }
        {
          map(child => {
            const className = get('props.className', child);
            
            if (className) {
              return update('props.className', () => cx(className, 'st2-flex-table__column'), child);
            }

            return child;
          })([].concat(children))
        }
      </div>
    );
  }
}

export class FlexTableColumn extends React.Component {
  static actions = actions

  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    fixed: PropTypes.bool,
  }

  render() {
    const { className, children, fixed, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-flex-table__column', fixed && 'st2-flex-table__column--fixed', className)}>
        { children }
      </div>
    );
  }
}

export class FlexTableInsert extends React.Component {
  static actions = actions

  static propTypes = {
    className: PropTypes.string,
    visible: PropTypes.bool,
    children: PropTypes.node,
  }

  static defaultProps = {
    visible: true,
  }

  render() {
    const { className, visible, children, ...props } = this.props;

    if (!visible) {
      return null;
    }

    return (
      <div {...props} className={cx('st2-flex-insert', className)}>
        { children }
      </div>
    );
  }
}

export class FlexTableInsertColumn extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-flex-insert__column', className)}>
        { children }
      </div>
    );
  }
}

export default FlexTable;
