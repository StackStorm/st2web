// Copyright 2021 The StackStorm Authors.
// Copyright 2020 Extreme Networks, Inc.
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

//@flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { PropTypes } from 'prop-types';
import cx from 'classnames';


import Action from './action';
import Pack from './pack';

import style from './style.css';

@connect(
  ({ flow: { actions }}) => ({ actions })
)
// export default class Palette extends Component<{
//   className?: string,
//   actions: Array<Object>,
// }, {
//   search: string,
// }> {
export default class Palette extends Component {
  static propTypes = {
    className: PropTypes.string,
    actions: PropTypes.array,
  }

  state = {
    search: '',
  }

  handleSearch(e: MouseEvent) {
    if (e.target instanceof window.HTMLInputElement) {
      this.setState({ search: e.target.value });
    }
  }

  style = style

  render() {
    const { actions } = this.props;
    const { search } = this.state;

    return (
      <div className={cx(this.props.className, this.style.component)}>
        <div className={this.style.search}>
          <input
            type="text"
            className={this.style.searchField}
            onChange={e => this.handleSearch(e)}
            placeholder="Library"
          />
        </div>
        <div className={this.style.list}>
          {
            actions
              .filter(action => action.ref.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) > -1)
              .reduce((acc, action) => {
                let pack = acc.find(pack => pack.name === action.pack);
                if (!pack) {
                  pack = {
                    name: action.pack,
                    actions: [],
                  };
                  acc.push(pack);
                }

                pack.actions.push(action);

                return acc;
              }, [])
              .map(pack => {
                return (
                  <Pack key={pack.name} name={pack.name}>
                    {
                      pack.actions
                        .map(action => <Action key={action.ref} action={action} />)
                    }
                  </Pack>
                );
              })
          }
        </div>
      </div>
    );
  }
}
