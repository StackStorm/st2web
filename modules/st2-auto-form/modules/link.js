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

import {
  Title,
} from '../wrappers';

export default class TextModule extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    name: PropTypes.string,
    spec: PropTypes.object,
    data: PropTypes.string,
    href: PropTypes.string,
  }

  render() {
    const { className = '', name, spec, data, href } = this.props;

    return (
      <div className={cx('st2-auto-form-text', className)}>
        <Title name={name} spec={spec} />

        <div className="st2-auto-form__value">
          <a className="st2-auto-form__link" href={href}>
            { data }
          </a>
        </div>
      </div>
    );
  }
}
