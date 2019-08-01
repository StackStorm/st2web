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
import flexStyle from '@stackstorm/module-flex-table/style.pcss';

export default class InquiryFlexCard extends React.Component {
  static propTypes = {
    inquiry: PropTypes.object.isRequired,
    selected: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
  }

  static contextTypes = {
    scrollIntoView: PropTypes.func.isRequired,
  }

  static defaultProps = {
    isChild: false,
    displayUTC: false,
  }

  handleSelect(e) {
    e && e.preventDefault();
    e && e.stopPropagation();

    const { onSelect, inquiry } = this.props;
    onSelect(inquiry.id);
  }

  render() {
    const {
      inquiry,
      selected,
    } = this.props;

    return (
      <div
        key={`${inquiry.id}-card`}
        className={cx(flexStyle.card, selected === inquiry.id && flexStyle.active)}
        onClick={(e) => this.handleSelect(e)}
        data-test={`inquiry inquiry:${inquiry.id}`}
      >
        <div className={flexStyle.row}>

          <div className={flexStyle.column} title={inquiry.id}>
            <span className={style.actionName}>
              { inquiry.id }
            </span>
          </div>

        </div>
      </div>
    );
  }
}
