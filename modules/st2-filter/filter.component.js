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

import style from './style.css';

export default class Filter extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    label: PropTypes.string.isRequired,
    multiple: PropTypes.bool.isRequired,
    items: PropTypes.arrayOf(PropTypes.string).isRequired,
    activeItems: PropTypes.arrayOf(PropTypes.string).isRequired,
    onChange: PropTypes.func.isRequired,
  }

  static defaultProps = {
    multiple: false,
  }

  state = {
    visible: false,
    search: '',
  }

  handleToggleItem(item) {
    const { multiple, activeItems, onChange } = this.props;
    if (!item) {
      return onChange([]);
    }

    if (activeItems.includes(item)) {
      return onChange(activeItems.filter((v) => v !== item));
    }

    if (multiple) {
      return onChange(activeItems.concat(item));
    }

    return onChange([ item ]);
  }

  toggleVisible() {
    this.setState({
      visible: !this.state.visible,
    });
  }

  get visibleItems() {
    const { items, activeItems } = this.props;
    const { search } = this.state;

    return [
      ...activeItems
        .filter((item) => !search || item.includes(search))
      ,
      ...items
        .filter((item) => !activeItems.includes(item))
        .filter((item) => !search || item.includes(search))
      ,
    ];
  }

  render() {
    const { className, label, multiple, items, activeItems, onChange, ...props } = this.props;
    onChange;

    return (
      <div {...props} className={cx(style.component, className, this.state.visible && style.active)}>
        <div
          className={cx(style.label, activeItems.length > 0 && style.active)}
          onClick={() => this.toggleVisible()}
        >
          { label }
          { activeItems.length > 0 ? (
            <span className={style.labelActiveItems}>
            : { activeItems.join(', ') }
            </span>
          ) : null }
        </div>
        <div className={style.variants}>
          { items.length > 4 ? (
            <div className={style.search}>
              <input
                type="text"
                className={style.searchBar}
                placeholder="Find"
                value={this.state.search}
                onChange={({ target: { value: search } }) => this.setState({ search })}
              />
            </div>
          ) : null }

          { multiple && activeItems.length > 0 ? (
            <button className={style.clear} onClick={() => this.handleToggleItem(null)}>Clear selected</button>
          ) : null }

          <div className={style.list}>
            { this.visibleItems.map((item) => (
              <div
                key={item}
                className={cx(style.item, activeItems.includes(item) && style.active)}
                onClick={() => this.handleToggleItem(item)}
              >
                { item }
              </div>
            )) }
          </div>
        </div>
      </div>
    );
  }
}
