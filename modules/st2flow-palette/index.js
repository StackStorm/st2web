// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

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
